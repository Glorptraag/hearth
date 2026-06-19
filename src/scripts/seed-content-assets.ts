import { createAsset, createCommonsText, patch } from '@/lib/sanity/mutations';
import { query } from '@/lib/sanity/mutations';
import { assetRef, commonsTextRef } from '@/lib/sanity/helpers';
import { generateCommonsAudio } from './generate-commons-audio';

/**
 * Seeds test content assets and commons texts into Sanity.
 * Creates 3 assets + 2 commons texts, links them to existing activities,
 * and updates parent pack rollup counts.
 */
export async function seedContentAssets() {
  const results = {
    created: 0,
    linked: 0,
    failed: 0,
    errors: [] as string[],
    audio: {
      generated: 0,
      skipped: 0,
      failed: 0,
      skippedReason: undefined as string | undefined,
    },
  };

  // ── Create assets ──────────────────────────────────────────────────────────

  const assets = [
    {
      _id: 'asset.template.story-arc-three-box',
      title: 'Story Arc Three-Box Map',
      slug: 'story-arc-three-box',
      kind: 'template' as const,
      pageCount: 1,
      description: 'A simple three-box template for mapping the beginning, middle, and end of any story.',
      printGuidance: 'Print A4 portrait, B&W friendly. One per child.',
      ageBand: '5-7',
      license: 'hearth_proprietary' as const,
      tags: ['narrative', 'mapping', 'reusable_template'],
      status: 'published' as const,
    },
    {
      _id: 'asset.worksheet.number-bonds-rainbow-10',
      title: 'Number Bonds Rainbow (to 10)',
      slug: 'number-bonds-rainbow-10',
      kind: 'worksheet' as const,
      pageCount: 1,
      description: 'A rainbow-arc worksheet for practising number bonds to 10. Children colour each arc as they find a pair.',
      printGuidance: 'Print A4 portrait. Colour print recommended for the rainbow arcs.',
      ageBand: '5-7',
      license: 'hearth_proprietary' as const,
      tags: ['numeracy', 'number_bonds', 'colouring'],
      status: 'published' as const,
    },
    {
      _id: 'asset.template.kwl-chart',
      title: 'KWL Chart',
      slug: 'kwl-chart',
      kind: 'template' as const,
      pageCount: 1,
      description: 'Know / Wonder / Learned three-column chart. Reusable across any subject.',
      printGuidance: 'Print A4 landscape or portrait, B&W friendly.',
      ageBand: 'all',
      license: 'hearth_proprietary' as const,
      tags: ['inquiry', 'reflection', 'reusable_template'],
      status: 'published' as const,
    },
  ];

  for (const assetInput of assets) {
    try {
      await createAsset(assetInput);
      results.created++;
    } catch (err) {
      results.errors.push(`Asset "${assetInput.title}": ${err instanceof Error ? err.message : String(err)}`);
      results.failed++;
    }
  }

  // ── Create commons texts ───────────────────────────────────────────────────

  const commonsTexts = [
    {
      _id: 'commons.aesop.tortoise-and-hare',
      title: 'The Tortoise and the Hare',
      slug: 'tortoise-and-hare',
      kind: 'fable' as const,
      tradition: 'aesop',
      body: 'A Hare was making fun of the Tortoise one day for being so slow.\n\n"Do you ever get anywhere?" he asked with a mocking laugh.\n\n"Yes," replied the Tortoise, "and I get there sooner than you think. I\'ll run you a race and prove it."\n\nThe Hare was much amused at the idea of running a race with the Tortoise, but for the fun of the thing he agreed. So the Fox, who had consented to act as judge, marked the distance and started the runners off.\n\nThe Hare was soon far out of sight, and to make the Tortoise feel very deeply how ridiculous it was for him to try a race with a Hare, he lay down beside the course to take a nap until the Tortoise should catch up.\n\nThe Tortoise meanwhile kept going slowly but steadily, and, after a time, passed the place where the Hare was sleeping. But the Hare slept on very peacefully; and when at last he did wake up, the Tortoise was near the goal. The Hare now ran his swiftest, but he could not overtake the Tortoise in time.\n\nSlow and steady wins the race.',
      shortBody: 'A Hare mocked a Tortoise for being slow and agreed to race. The Hare ran far ahead, then napped by the road. The Tortoise kept going steadily, passed the sleeping Hare, and won the race.',
      readAloudVersion: 'A Hare was making fun of the Tortoise one day for being so slow. (pause)\n\n"Do you ever get anywhere?" he asked with a mocking laugh.\n\n"Yes," replied the Tortoise, "and I get there sooner than you think. I\'ll run you a race and prove it." (pause — let this sink in)\n\nThe Hare was much amused at the idea of running a race with the Tortoise, but for the fun of the thing he agreed. (pause)\n\nThe Hare was soon far out of sight, and he lay down beside the course to take a nap. (pause)\n\nThe Tortoise meanwhile kept going slowly but steadily. (slowly) And after a time... passed the place where the Hare was sleeping. (pause)\n\nBut the Hare slept on very peacefully. And when at last he did wake up — the Tortoise was near the goal! (with surprise)\n\nThe Hare now ran his swiftest, but he could not overtake the Tortoise in time. (pause)\n\nSlow and steady wins the race.',
      estimatedReadAloudMinutes: 2,
      length: 'short' as const,
      readingLevel: '5-7',
      themes: ['perseverance', 'humility', 'overconfidence'],
      moralOrLesson: 'Slow and steady wins the race. Overconfidence and arrogance lead to failure.',
      source: 'Aesop, retold by Joseph Jacobs, 1894',
      license: 'public_domain' as const,
      tags: ['fable', 'aesop', 'animals', 'race', 'moral_story'],
      status: 'published' as const,
    },
    {
      _id: 'commons.bible_kjv.psalm-23',
      title: 'Psalm 23',
      slug: 'psalm-23',
      kind: 'psalm' as const,
      tradition: 'bible_kjv',
      body: 'The LORD is my shepherd; I shall not want.\n\nHe maketh me to lie down in green pastures: he leadeth me beside the still waters.\n\nHe restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.\n\nYea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.\n\nThou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.\n\nSurely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
      readAloudVersion: 'The LORD is my shepherd; I shall not want. (pause)\n\nHe maketh (makes) me to lie down in green pastures: he leadeth (leads) me beside the still waters. (pause)\n\nHe restoreth (restores) my soul: he leadeth (leads) me in the paths of righteousness for his name\'s sake. (pause)\n\nYea (yes), though I walk through the valley of the shadow of death, I will fear no evil: for thou (you) art with me; thy (your) rod and thy (your) staff they comfort me. (pause — this is the heart of the psalm)\n\nThou (you) preparest a table before me in the presence of mine enemies: thou anointest (you anoint) my head with oil; my cup runneth (runs) over. (pause)\n\nSurely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever. (slowly, with weight)',
      estimatedReadAloudMinutes: 2,
      length: 'short' as const,
      readingLevel: '7-9',
      themes: ['trust', 'provision', 'comfort', 'faith'],
      source: 'King James Version, 1611. Public domain.',
      license: 'public_domain' as const,
      tags: ['psalm', 'bible', 'kjv', 'shepherd', 'comfort'],
      status: 'published' as const,
    },
  ];

  const createdTextSlugs: string[] = [];
  for (const textInput of commonsTexts) {
    try {
      await createCommonsText(textInput);
      results.created++;
      createdTextSlugs.push(textInput.slug);
    } catch (err) {
      results.errors.push(`CommonsText "${textInput.title}": ${err instanceof Error ? err.message : String(err)}`);
      results.failed++;
    }
  }

  // ── Generate read-aloud narration audio for the seeded texts ────────────────
  // Gated on DEEPGRAM_API_KEY so the seed still works without TTS configured.
  // Audio failures are tracked separately and do NOT fail the content seed.
  if (createdTextSlugs.length > 0) {
    if (process.env.DEEPGRAM_API_KEY) {
      for (const slug of createdTextSlugs) {
        try {
          const audio = await generateCommonsAudio({ slug });
          results.audio.generated += audio.generated;
          results.audio.skipped += audio.skipped;
          results.audio.failed += audio.failed;
          results.errors.push(...audio.errors);
        } catch (err) {
          results.audio.failed++;
          results.errors.push(`Audio "${slug}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      results.audio.skippedReason = 'DEEPGRAM_API_KEY not set';
    }
  }

  // ── Link assets/texts to existing activities ───────────────────────────────
  // Find published activities to attach test content to

  try {
    const activities = await query<Array<{ _id: string; title: string }>>(
      `*[_type == "activity" && status == "published"][0...2]{ _id, title }`
    );

    if (activities.length > 0) {
      // Link story arc template + tortoise fable to first activity
      await patch(activities[0]._id, {
        assets: [
          assetRef('asset.template.story-arc-three-box', 'core', 'Children map the story arc'),
        ],
        commonsTexts: [
          commonsTextRef('commons.aesop.tortoise-and-hare', 'core', 'read_aloud', 'Read aloud before mapping'),
        ],
      });
      results.linked++;
    }

    if (activities.length > 1) {
      // Link number bonds + KWL chart to second activity
      await patch(activities[1]._id, {
        assets: [
          assetRef('asset.worksheet.number-bonds-rainbow-10', 'core'),
          assetRef('asset.template.kwl-chart', 'optional', 'For reflection after the activity'),
        ],
      });
      results.linked++;
    }
  } catch (err) {
    results.errors.push(`Linking: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Update pack rollup counts ──────────────────────────────────────────────

  try {
    const packs = await query<Array<{ _id: string }>>(
      `*[_type == "pack" && status == "published"][0...1]{ _id }`
    );

    if (packs.length > 0) {
      await patch(packs[0]._id, {
        assetCounts: {
          total: 3 + results.audio.generated,
          template: 2,
          worksheet: 1,
          reference: 0,
          card_set: 0,
          handout: 0,
          audio: results.audio.generated,
          manipulative: 0,
        },
        commonsTextCount: 2,
      });
    }
  } catch (err) {
    results.errors.push(`Pack rollup: ${err instanceof Error ? err.message : String(err)}`);
  }

  return results;
}
