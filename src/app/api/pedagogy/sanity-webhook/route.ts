import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { embedText } from '@/lib/pedagogy/embedding';
import {
  isPedagogyType,
  buildChunkText,
  buildChunkMetadata,
  computeContentHash,
  getLayerKey,
  type SanityPKBDocument,
} from '@/lib/pedagogy/chunk-builder';

export async function POST(request: NextRequest) {
  // 1. Verify auth
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.SANITY_WEBHOOK_SECRET}`;
  if (!authHeader || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const docType = payload._type as string;

    // 2. Filter to PKB types only
    if (!isPedagogyType(docType)) {
      return NextResponse.json({ ok: true, action: 'ignored' });
    }

    const docId = (payload._id as string).replace(/^drafts\./, '');
    const isDraft = (payload._id as string).startsWith('drafts.');
    const isDelete = payload.operation === 'delete';
    const suggestedDraft = payload.suggestedDraft === true;

    // 3. Delete chunk if: delete operation, draft state, or suggestedDraft
    if (isDelete || isDraft || suggestedDraft) {
      await db.execute(sql`
        DELETE FROM pedagogy_knowledge_chunks WHERE id = ${docId}
      `);
      return NextResponse.json({ ok: true, action: 'deleted', id: docId });
    }

    // 4. Create/update — compose text and check hash
    const doc = payload as SanityPKBDocument;
    const chunkText = buildChunkText(doc);

    if (!chunkText) {
      console.warn(`[pedagogy-webhook] Empty chunk text for ${docId}, skipping`);
      return NextResponse.json({ ok: true, action: 'skipped', reason: 'empty_text' });
    }

    const contentHash = computeContentHash(chunkText);
    const metadata = buildChunkMetadata(doc);
    const pedagogyKey = (metadata.pedagogyKey as string) ?? 'unknown';
    const layer = getLayerKey(doc._type);

    // 5. Check if existing chunk has matching hash
    const existing = await db.execute(sql`
      SELECT content_hash FROM pedagogy_knowledge_chunks WHERE id = ${docId}
    `);

    const existingRow = (existing.rows as Array<{ content_hash: string }>)[0];

    if (existingRow && existingRow.content_hash === contentHash) {
      // Hash matches — update metadata only, skip embedding
      await db.execute(sql`
        UPDATE pedagogy_knowledge_chunks
        SET metadata = ${JSON.stringify(metadata)}::jsonb,
            updated_at = NOW()
        WHERE id = ${docId}
      `);
      return NextResponse.json({ ok: true, action: 'metadata_updated', id: docId });
    }

    // 6. Embed and upsert
    const embedding = await embedText(chunkText);
    const embeddingLiteral = `[${embedding.join(',')}]`;

    await db.execute(sql`
      INSERT INTO pedagogy_knowledge_chunks (id, pedagogy_key, layer, text, embedding, metadata, content_hash, sanity_doc_id, updated_at)
      VALUES (
        ${docId},
        ${pedagogyKey},
        ${layer},
        ${chunkText},
        ${embeddingLiteral}::vector,
        ${JSON.stringify(metadata)}::jsonb,
        ${contentHash},
        ${docId},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        pedagogy_key = EXCLUDED.pedagogy_key,
        layer = EXCLUDED.layer,
        text = EXCLUDED.text,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW()
    `);

    return NextResponse.json({ ok: true, action: existingRow ? 'updated' : 'created', id: docId });
  } catch (error) {
    console.error('[pedagogy-webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
