import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createFullModule } from '@/lib/sanity/mutations';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';
import { routeHandler } from '@/lib/api-helpers';

const createdViaEnum = z.enum([
  'material',
  'process',
  'inquiry',
  'retrospective',
  'understanding',
  'editorial',
]);

const materialSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().optional().default(true),
  alternative: z.string().optional(),
});

const facilitatorGuidanceSchema = z.object({
  before: z.string().optional(),
  during: z.string().optional(),
  challenges: z.string().optional(),
});

const activityInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  summary: z.string().optional(),
  instructions: z.string().min(1),
  facilitatorGuidance: facilitatorGuidanceSchema.optional(),
  materials: z.array(materialSchema).optional(),
  duration: z.object({ min: z.number(), max: z.number() }).optional(),
  setting: z.enum(['indoor', 'outdoor', 'either']).optional(),
  energyLevel: z.enum(['calm', 'moderate', 'active']).optional(),
  modality: z.enum(['kinesthetic', 'visual', 'auditory', 'narrative', 'social']).optional(),
  observationPrompts: z.array(z.string()).optional(),
  reflectionPrompts: z.array(z.string()).optional(),
  capabilityThreadIds: z.array(z.string()).optional(),
  badgeIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

const approachInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  modality: z.enum(['kinesthetic', 'visual', 'auditory', 'narrative', 'social', 'exploratory']).optional(),
  description: z.string().optional(),
  activities: z.array(activityInputSchema).min(1),
  status: z.enum(['draft', 'published']).optional(),
});

const moduleInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  targetUnderstanding: z.string().min(1),
  understandingIndicators: z.object({
    emerging: z.string().optional(),
    developing: z.string().optional(),
    demonstrating: z.string().optional(),
  }).optional(),
  subjects: z.array(z.enum([
    'english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages',
  ])).optional(),
  ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
  duration: z.object({ min: z.number(), max: z.number() }).optional(),
  badgeIds: z.array(z.string()).optional(),
  capabilityThreadIds: z.array(z.string()).optional(),
  approaches: z.array(approachInputSchema).min(1),
  status: z.enum(['draft', 'published']).optional(),
  createdVia: createdViaEnum,
});

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json();
  const parsed = moduleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const result = await createFullModule({
      title: data.title,
      slug: data.slug,
      targetUnderstanding: data.targetUnderstanding,
      understandingIndicators: data.understandingIndicators,
      subjects: data.subjects,
      ageRange: data.ageRange,
      duration: data.duration,
      badgeIds: data.badgeIds,
      capabilityThreadIds: data.capabilityThreadIds,
      status: data.status,
      authorFamilyId: family.id,
      createdVia: data.createdVia,
      approaches: data.approaches.map((app) => ({
        title: app.title,
        slug: app.slug,
        modality: app.modality,
        description: app.description,
        status: app.status,
        activities: app.activities.map((act) => ({
          title: act.title,
          slug: act.slug,
          summary: act.summary,
          instructions: act.instructions,
          facilitatorGuidance: act.facilitatorGuidance,
          materials: act.materials,
          duration: act.duration,
          setting: act.setting,
          energyLevel: act.energyLevel,
          modality: act.modality,
          observationPrompts: act.observationPrompts,
          reflectionPrompts: act.reflectionPrompts,
          capabilityThreadIds: act.capabilityThreadIds,
          badgeIds: act.badgeIds,
          status: act.status,
        })),
      })),
    });

    await db
      .insert(familyLibrary)
      .values({ familyId: family.id, sanityModuleId: result.module._id })
      .onConflictDoNothing();

    rebuildSnapshot(family.id, 'library_change').catch((err) =>
      console.error('[modules/publish] Snapshot rebuild failed:', err)
    );

    return NextResponse.json({
      moduleId: result.module._id,
      approaches: result.approaches.map((a) => ({
        approachId: a._id,
        activityIds: a.activityIds,
      })),
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create module', detail: message }, { status: 500 });
  }
}, { route: 'POST /api/modules/publish' });
