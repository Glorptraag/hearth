import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { addMonths, subDays, addDays, format } from 'date-fns';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing seed data
  const existingFamily = await db.query.families.findFirst({
    where: eq(schema.families.clerkUserId, 'clerk_test_001'),
  });

  if (existingFamily) {
    console.log('Clearing existing seed data...');

    // Get learner IDs for this family
    const existingLearners = await db.query.learners.findMany({
      where: eq(schema.learners.familyId, existingFamily.id),
    });
    const learnerIds = existingLearners.map((l) => l.id);

    // Delete in FK-safe order: children first, then parents
    for (const lid of learnerIds) {
      await db.delete(schema.badgeAwards).where(eq(schema.badgeAwards.learnerId, lid));
      await db.delete(schema.badgeAssessmentLogs).where(eq(schema.badgeAssessmentLogs.learnerId, lid));
      await db.delete(schema.capabilityObservations).where(eq(schema.capabilityObservations.learnerId, lid));
      await db.delete(schema.facilitatorNotes).where(eq(schema.facilitatorNotes.learnerId, lid));
    }
    await db.delete(schema.notifications).where(eq(schema.notifications.familyId, existingFamily.id));
    await db.delete(schema.plannerEntries).where(eq(schema.plannerEntries.familyId, existingFamily.id));
    await db.delete(schema.learningEntries).where(eq(schema.learningEntries.familyId, existingFamily.id));
    await db.delete(schema.familySettings).where(eq(schema.familySettings.familyId, existingFamily.id));
    await db.delete(schema.familyIntelligenceSnapshots).where(eq(schema.familyIntelligenceSnapshots.familyId, existingFamily.id));
    await db.delete(schema.badgeDefinitions).where(eq(schema.badgeDefinitions.familyId, existingFamily.id));
    await db.delete(schema.learners).where(eq(schema.learners.familyId, existingFamily.id));
    await db.delete(schema.families).where(eq(schema.families.id, existingFamily.id));
  }

  // Also clean up any orphaned badge awards/observations that might reference learners we're about to delete
  // We'll handle this by inserting fresh

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // ─── Family ───
  const [family] = await db
    .insert(schema.families)
    .values({
      clerkUserId: 'clerk_test_001',
      familyName: 'The Campbells',
    })
    .returning();

  console.log(`✅ Family: ${family.familyName} (${family.id})`);

  // ─── Learners ───
  const [emma] = await db
    .insert(schema.learners)
    .values({
      familyId: family.id,
      name: 'Emma',
      dateOfBirth: '2019-03-15',
      shapeIcon: '🌸',
      colourToken: 'rose',
      displayOrder: 0,
    })
    .returning();

  const [liam] = await db
    .insert(schema.learners)
    .values({
      familyId: family.id,
      name: 'Liam',
      dateOfBirth: '2021-07-22',
      shapeIcon: '🌊',
      colourToken: 'blue',
      displayOrder: 1,
    })
    .returning();

  console.log(`✅ Learners: ${emma.name} (${emma.id}), ${liam.name} (${liam.id})`);

  // ─── Family Settings ───
  await db.insert(schema.familySettings).values({
    familyId: family.id,
    pedagogyPreference: 'eclectic',
    state: 'QLD',
    heuNextReportDate: format(addMonths(today, 3), 'yyyy-MM-dd'),
  });

  console.log('✅ Family settings');

  // ─── Learning Entries (12 entries over last 2 weeks) ───
  const entries = [
    {
      title: 'Morning nature walk at Enoggera Creek',
      description:
        'Walked along the creek path, identified three bird species using the field guide. Emma sketched a cormorant drying its wings. Liam collected leaves and we sorted them by size and shape back home.',
      dateOccurred: format(subDays(today, 1), 'yyyy-MM-dd'),
      subjects: ['science', 'arts'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 3 },
      discoveriesPerLearner: {
        [emma.id]: 'Noticed cormorants hold wings out to dry — asked why other birds don\'t need to',
        [liam.id]: 'Sorted leaves into big and small groups independently',
      },
      status: 'complete',
    },
    {
      title: 'Handwriting practice — cursive letter joins',
      description:
        'Emma practised joining letters in cursive using the Victorian Modern Cursive guide. Focused on "th", "sh", and "ch" joins. Liam traced uppercase letters A–F on the whiteboard.',
      dateOccurred: format(subDays(today, 2), 'yyyy-MM-dd'),
      subjects: ['english'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 3, [liam.id]: 2 },
      status: 'complete',
    },
    {
      title: 'Baking anzac biscuits',
      description:
        'Followed the recipe together. Emma measured ingredients using cups and scales — practised doubling the recipe (multiplication). Liam counted tablespoons of golden syrup and helped stir. Talked about the history of Anzac biscuits and why they were sent to soldiers.',
      dateOccurred: format(subDays(today, 3), 'yyyy-MM-dd'),
      subjects: ['mathematics', 'hass'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 4 },
      status: 'complete',
    },
    {
      title: 'Times tables — 3s and 4s',
      description:
        'Used the multiplication chart and skip-counting songs. Emma is confident with 3s, working on 4s. Used counters in groups to visualise.',
      dateOccurred: format(subDays(today, 4), 'yyyy-MM-dd'),
      subjects: ['mathematics'],
      learnerIds: [emma.id],
      engagementPerLearner: { [emma.id]: 3 },
      status: 'complete',
    },
    {
      title: 'Read-aloud: Possum Magic by Mem Fox',
      description:
        'Read together on the couch. Liam loved the illustrations and asked about each Australian city. Emma found all the cities on our wall map. Both kids drew their favourite Australian animal after.',
      dateOccurred: format(subDays(today, 5), 'yyyy-MM-dd'),
      subjects: ['english', 'hass', 'arts'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 4 },
      discoveriesPerLearner: {
        [liam.id]: 'Recognised Brisbane on the map because "that\'s where we live!"',
      },
      status: 'complete',
    },
    {
      title: 'Building a cubby house from boxes',
      description:
        'Used large cardboard boxes from the garage. Emma designed a floor plan on paper first, measuring boxes with a tape measure. Liam decorated with textas. They had to problem-solve when the roof kept collapsing — ended up using masking tape reinforcement.',
      dateOccurred: format(subDays(today, 6), 'yyyy-MM-dd'),
      subjects: ['technologies', 'mathematics', 'arts'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 3 },
      status: 'complete',
    },
    {
      title: 'Spelling list — Week 8 words',
      description:
        'Emma\'s words this week: through, thought, caught, brought, daughter. Practised look-cover-write-check. Got 4/5 on first attempt — "caught" needs more work. Used rainbow writing to make it more fun.',
      dateOccurred: format(subDays(today, 7), 'yyyy-MM-dd'),
      subjects: ['english'],
      learnerIds: [emma.id],
      engagementPerLearner: { [emma.id]: 2 },
      status: 'complete',
    },
    {
      title: 'Gardening — planting tomato seedlings',
      description:
        'Transplanted cherry tomato seedlings into the raised bed. Emma measured the spacing (30cm apart), Liam dug the holes. Discussed what plants need to grow — sunlight, water, soil nutrients. Set up a watering roster.',
      dateOccurred: format(subDays(today, 8), 'yyyy-MM-dd'),
      subjects: ['science', 'mathematics'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 4 },
      discoveriesPerLearner: {
        [emma.id]: 'Asked if plants can grow without soil — wants to research hydroponics',
      },
      status: 'complete',
    },
    {
      title: 'PE — obstacle course in the backyard',
      description:
        'Set up an obstacle course with cones, pool noodle hurdles, and a balance beam (plank on bricks). Timed each other. Emma tracked their times on a chart and calculated improvements.',
      dateOccurred: format(subDays(today, 10), 'yyyy-MM-dd'),
      subjects: ['hpe', 'mathematics'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 4 },
      status: 'complete',
    },
    {
      title: 'Watercolour painting — gum trees',
      description:
        'Painted eucalyptus trees from observation in the backyard. Practised wet-on-wet technique for the sky. Emma experimented with mixing greens. Liam focused on trunk texture with dry brush strokes.',
      dateOccurred: format(subDays(today, 11), 'yyyy-MM-dd'),
      subjects: ['arts', 'science'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 4, [liam.id]: 3 },
      status: 'draft',
    },
    {
      title: 'Number bonds to 10 — Liam',
      description:
        'Used counters and ten-frames. Liam is getting confident with bonds to 5, starting to work on bonds to 10. Used "shake and spill" game with red and yellow counters.',
      dateOccurred: format(subDays(today, 12), 'yyyy-MM-dd'),
      subjects: ['mathematics'],
      learnerIds: [liam.id],
      engagementPerLearner: { [liam.id]: 3 },
      status: 'complete',
    },
    {
      title: 'Japanese greetings — first lesson',
      description:
        'Started our Japanese language journey using the NHK World Easy Japanese series. Learned こんにちは (konnichiwa), おはよう (ohayou), and ありがとう (arigatou). Kids practised greeting each other. Emma wrote the romaji in her language notebook.',
      dateOccurred: format(subDays(today, 13), 'yyyy-MM-dd'),
      subjects: ['languages'],
      learnerIds: [emma.id, liam.id],
      engagementPerLearner: { [emma.id]: 3, [liam.id]: 3 },
      status: 'draft',
    },
  ];

  const insertedEntries = [];
  for (const entry of entries) {
    const [inserted] = await db
      .insert(schema.learningEntries)
      .values({
        familyId: family.id,
        source: 'logger',
        ...entry,
      })
      .returning();
    insertedEntries.push(inserted);
  }

  console.log(`✅ ${insertedEntries.length} learning entries`);

  // ─── Capability Observations ───
  // Emma: 5 observations across 3 threads
  const emmaObservations = [
    { threadId: 'science-inquiry', status: 'developing', sourceEntryId: insertedEntries[0].id },
    { threadId: 'science-inquiry', status: 'emerging', sourceEntryId: insertedEntries[7].id },
    { threadId: 'english-writing', status: 'developing', sourceEntryId: insertedEntries[1].id },
    { threadId: 'english-writing', status: 'emerging', sourceEntryId: insertedEntries[6].id },
    { threadId: 'mathematics-number', status: 'developing', sourceEntryId: insertedEntries[3].id },
  ];

  for (const obs of emmaObservations) {
    await db.insert(schema.capabilityObservations).values({
      learnerId: emma.id,
      ...obs,
    });
  }

  // Liam: 3 observations, all emerging
  const liamObservations = [
    { threadId: 'science-inquiry', status: 'emerging', sourceEntryId: insertedEntries[0].id },
    { threadId: 'mathematics-number', status: 'emerging', sourceEntryId: insertedEntries[10].id },
    { threadId: 'english-speaking', status: 'emerging', sourceEntryId: insertedEntries[4].id },
  ];

  for (const obs of liamObservations) {
    await db.insert(schema.capabilityObservations).values({
      learnerId: liam.id,
      ...obs,
    });
  }

  console.log('✅ Capability observations (5 for Emma, 3 for Liam)');

  // ─── Badge Definitions ───
  const [natureExplorer] = await db
    .insert(schema.badgeDefinitions)
    .values({
      familyId: family.id,
      title: 'Nature Explorer',
      description: 'Awarded for consistent curiosity and observation of the natural world',
      emoji: '🌿',
      criteriaSummary: 'Demonstrate science inquiry skills through nature-based learning across at least 3 entries',
      capabilityThreadIds: ['science-inquiry'],
      observationThreshold: 2,
    })
    .returning();

  const [wordWeaver] = await db
    .insert(schema.badgeDefinitions)
    .values({
      familyId: family.id,
      title: 'Word Weaver',
      description: 'Celebrating growth in written expression and spelling mastery',
      emoji: '✍️',
      criteriaSummary: 'Show developing writing skills through spelling, handwriting, and creative writing',
      capabilityThreadIds: ['english-writing'],
      observationThreshold: 3,
    })
    .returning();

  console.log('✅ Badge definitions: Nature Explorer, Word Weaver');

  // ─── Badge Award (Emma — Nature Explorer) ───
  await db.insert(schema.badgeAwards).values({
    badgeDefinitionId: natureExplorer.id,
    learnerId: emma.id,
    awardedBy: 'parent',
    evidenceEntryIds: [insertedEntries[0].id, insertedEntries[7].id],
    notes: 'Emma has shown amazing curiosity about the natural world, always asking "why" questions about what she observes.',
  });

  console.log('✅ Badge award: Emma — Nature Explorer');

  // ─── Planner Entries (3 for next week) ───
  const nextMonday = addDays(today, ((8 - today.getDay()) % 7) || 7);

  await db.insert(schema.plannerEntries).values([
    {
      familyId: family.id,
      date: format(nextMonday, 'yyyy-MM-dd'),
      title: 'Library visit — return books and choose new read-alouds',
      learnerIds: [emma.id, liam.id],
      status: 'planned',
      displayOrder: 0,
    },
    {
      familyId: family.id,
      date: format(addDays(nextMonday, 1), 'yyyy-MM-dd'),
      title: 'Measurement activity — baking banana bread (halving recipe)',
      learnerIds: [emma.id, liam.id],
      status: 'planned',
      notes: 'Practice halving fractions with Emma, counting with Liam',
      displayOrder: 0,
    },
    {
      familyId: family.id,
      date: format(addDays(nextMonday, 3), 'yyyy-MM-dd'),
      title: 'Botanic Gardens excursion — rainforest walk',
      learnerIds: [emma.id, liam.id],
      status: 'planned',
      notes: 'Bring sketchbooks and the bird field guide',
      displayOrder: 0,
    },
  ]);

  console.log('✅ 3 planner entries');

  // ─── Notifications ───
  await db.insert(schema.notifications).values([
    {
      familyId: family.id,
      type: 'insight',
      tier: 'whisper',
      title: 'Emma is building momentum in science inquiry',
      body: 'She has 2 observations in the science-inquiry thread this fortnight. One more and she may be ready for the Nature Explorer badge assessment.',
      state: 'visible',
      destinationRoute: '/our-story',
    },
    {
      familyId: family.id,
      type: 'reminder',
      tier: 'nudge',
      title: 'HEU report due in 3 months',
      body: 'Your next Home Education Unit report is due soon. Keep logging to build your portfolio evidence.',
      state: 'visible',
      destinationRoute: '/settings',
      expiresAt: addMonths(today, 3),
    },
  ]);

  console.log('✅ 2 notifications');

  console.log('\n🎉 Seed complete!');
  console.log(`\nFamily ID: ${family.id}`);
  console.log(`Emma ID: ${emma.id}`);
  console.log(`Liam ID: ${liam.id}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
