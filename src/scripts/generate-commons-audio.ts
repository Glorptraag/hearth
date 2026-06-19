import { sanityWriteClient, sanityServerClient } from '@/lib/sanity/client';
import { createAsset, appendToArray } from '@/lib/sanity/mutations';
import { keyedRefs } from '@/lib/sanity/helpers';
import { synthesizeSpeech } from '@/lib/ai/tts';
import { readAloudToNarration, splitForTts } from '@/lib/ai/read-aloud';

/**
 * Write-time generation of read-aloud narration audio for commons texts.
 *
 * For each published `commonsText` that carries a `readAloudVersion` (or falls
 * back to `body`) and has no audio asset yet, this:
 *   1. flattens the Portable Text and normalises pacing cues → narration text,
 *   2. synthesises MP3 via Deepgram Aura (chunked under the per-request limit),
 *   3. uploads the audio to Sanity's file store,
 *   4. creates a published `asset` (kind: 'audio') bound to that file and linked
 *      back to the text (`relatedCommonsTexts`), and
 *   5. mirrors the link on the text (`relatedAssets`).
 *
 * Idempotent: assets use a deterministic `_id` (`asset.audio.<slug>`) and texts
 * that already have audio are skipped unless `force` is set.
 */

export interface GenerateCommonsAudioOptions {
  /** Resolve narration + report char counts, but make no API calls or writes. */
  dryRun?: boolean;
  /** Cap the number of texts processed (after the no-audio filter). */
  limit?: number;
  /** Restrict to a single commons-text slug. */
  slug?: string;
  /** Regenerate even for texts that already have an audio asset. */
  force?: boolean;
}

export interface GenerateCommonsAudioItem {
  textId: string;
  title: string;
  slug: string;
  status: 'generated' | 'skipped' | 'failed' | 'dry-run';
  chars?: number;
  chunks?: number;
  reason?: string;
  assetId?: string;
}

export interface GenerateCommonsAudioResult {
  generated: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  items: GenerateCommonsAudioItem[];
  errors: string[];
}

interface CommonsTextRow {
  _id: string;
  title: string;
  slug?: { current?: string };
  readAloudVersion?: unknown[];
  body?: unknown[];
  hasAudio: boolean;
}

export async function generateCommonsAudio(
  opts: GenerateCommonsAudioOptions = {}
): Promise<GenerateCommonsAudioResult> {
  const { dryRun = false, limit, slug, force = false } = opts;
  const result: GenerateCommonsAudioResult = {
    generated: 0,
    skipped: 0,
    failed: 0,
    dryRun,
    items: [],
    errors: [],
  };

  const slugFilter = slug ? ' && slug.current == $slug' : '';
  // Read through the authed server client: the tokenless read role is blind to
  // some content in prod (see the tokenless-read note in the data-arch docs).
  const texts = await sanityServerClient.fetch<CommonsTextRow[]>(
    `*[_type == "commonsText" && status == "published"${slugFilter}]{
      _id, title, slug, readAloudVersion, body,
      "hasAudio": count(*[_type == "asset" && kind == "audio" && references(^._id)]) > 0
    } | order(title asc)`,
    slug ? { slug } : {}
  );

  let processed = 0;
  for (const text of texts) {
    if (limit != null && processed >= limit) break;

    const textSlug = text.slug?.current ?? text._id.replace(/[^a-z0-9]+/gi, '-');

    if (text.hasAudio && !force) {
      result.skipped++;
      result.items.push({ textId: text._id, title: text.title, slug: textSlug, status: 'skipped', reason: 'already has audio' });
      continue;
    }

    const source = text.readAloudVersion?.length ? text.readAloudVersion : text.body;
    const narration = readAloudToNarration(source);
    if (!narration) {
      result.skipped++;
      result.items.push({ textId: text._id, title: text.title, slug: textSlug, status: 'skipped', reason: 'no narratable text' });
      continue;
    }

    const chunks = splitForTts(narration);
    processed++;

    if (dryRun) {
      result.items.push({
        textId: text._id,
        title: text.title,
        slug: textSlug,
        status: 'dry-run',
        chars: narration.length,
        chunks: chunks.length,
      });
      continue;
    }

    try {
      const buffers: Buffer[] = [];
      let contentType = 'audio/mpeg';
      for (const chunk of chunks) {
        const synth = await synthesizeSpeech(chunk);
        buffers.push(synth.audio);
        contentType = synth.contentType;
      }
      const audio = Buffer.concat(buffers);

      const fileAsset = await sanityWriteClient.assets.upload('file', audio, {
        filename: `${textSlug}-narration.mp3`,
        contentType,
      });

      const assetId = `asset.audio.${textSlug}`;
      await createAsset({
        _id: assetId,
        title: `${text.title} — Narration`,
        slug: `${textSlug}-narration`,
        kind: 'audio',
        description: `Audio narration of "${text.title}", generated from its read-aloud version.`,
        license: 'hearth_proprietary',
        source: 'Generated with Deepgram Aura text-to-speech',
        status: 'published',
        fileAssetId: fileAsset._id,
        commonsTextIds: [text._id],
      });

      // Mirror the link on the text, without clobbering existing related assets.
      const existing = await sanityServerClient.fetch<string[] | null>(
        `*[_id == $id][0].relatedAssets[]._ref`,
        { id: text._id }
      );
      if (!existing?.includes(assetId)) {
        await appendToArray(text._id, 'relatedAssets', keyedRefs([assetId]));
      }

      result.generated++;
      result.items.push({
        textId: text._id,
        title: text.title,
        slug: textSlug,
        status: 'generated',
        chars: narration.length,
        chunks: chunks.length,
        assetId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push(`"${text.title}": ${message}`);
      result.items.push({ textId: text._id, title: text.title, slug: textSlug, status: 'failed', reason: message });
    }
  }

  return result;
}

// ── CLI entry: `npm run generate:audio -- --dry-run --limit=5 --slug=psalm-23` ──
const invokedDirectly =
  typeof process !== 'undefined' &&
  Boolean(process.argv[1]) &&
  import.meta.url === `file://${process.argv[1]}`;

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const flag = (name: string) => argv.includes(`--${name}`);
  const value = (name: string) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split('=')[1] : undefined;
  };
  const limitArg = value('limit');

  generateCommonsAudio({
    dryRun: flag('dry-run'),
    force: flag('force'),
    slug: value('slug'),
    limit: limitArg ? Number(limitArg) : undefined,
  })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      console.log(
        `\n${r.dryRun ? '[dry run] ' : ''}generated=${r.generated} skipped=${r.skipped} failed=${r.failed}`
      );
      process.exit(r.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
