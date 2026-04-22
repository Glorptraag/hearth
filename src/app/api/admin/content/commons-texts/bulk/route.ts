import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { createCommonsText } from '@/lib/sanity/mutations';
import { commonsTextPublishSchema } from '@/lib/content-studio/validation';
import { z } from 'zod';

const bulkSchema = z.array(z.object({
  title: z.string().min(1),
  kind: z.string(),
  tradition: z.string().min(1),
  body: z.string().optional(),
  shortBody: z.string().optional(),
  readAloudVersion: z.string().optional(),
  estimatedReadAloudMinutes: z.number().optional(),
  length: z.string().optional(),
  readingLevel: z.string().optional(),
  themes: z.array(z.string()).optional(),
  moralOrLesson: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  license: z.enum(['public_domain', 'cc_by', 'cc_by_sa']),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
}));

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const body = await req.json();
  const result = bulkSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.issues }, { status: 400 });
  }

  const created = [];
  for (const item of result.data) {
    const doc = await createCommonsText({
      title: item.title,
      kind: item.kind as Parameters<typeof createCommonsText>[0]['kind'],
      tradition: item.tradition,
      body: item.body,
      shortBody: item.shortBody,
      readAloudVersion: item.readAloudVersion,
      estimatedReadAloudMinutes: item.estimatedReadAloudMinutes,
      length: item.length as Parameters<typeof createCommonsText>[0]['length'],
      readingLevel: item.readingLevel as Parameters<typeof createCommonsText>[0]['readingLevel'],
      themes: item.themes,
      moralOrLesson: item.moralOrLesson,
      source: item.source,
      sourceUrl: item.sourceUrl,
      license: item.license,
      tags: item.tags,
      status: item.status as 'draft' | 'published' | undefined,
    });
    created.push(doc._id);
  }

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.commons_text_bulk_import',
    targetResource: 'commonsText',
    targetId: `bulk:${created.length}`,
    metadata: { count: created.length },
  });

  return NextResponse.json({ created, count: created.length }, { status: 201 });
}
