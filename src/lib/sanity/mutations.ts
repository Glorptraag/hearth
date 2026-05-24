import { sanityWriteClient, sanityClient } from './client';
import { autoSlug, ref, keyedRefs, key, blockText, assetRef, commonsTextRef } from './helpers';

type SanityDoc = Record<string, unknown> & { _id?: string; _type: string };

// ─── Generic CRUD ────────────────────────────────────────────────────────────

export async function create<T extends SanityDoc>(doc: T) {
  return sanityWriteClient.create(doc);
}

export async function createWithId<T extends SanityDoc & { _id: string }>(doc: T) {
  return sanityWriteClient.createOrReplace(doc);
}

export async function upsert<T extends SanityDoc & { _id: string }>(doc: T) {
  const existing = await sanityClient.getDocument(doc._id);
  if (existing) return existing;
  return sanityWriteClient.createOrReplace(doc);
}

export async function patch(id: string, fields: Record<string, unknown>) {
  return sanityWriteClient.patch(id).set(fields).commit();
}

export async function unsetFields(id: string, fieldNames: string[]) {
  return sanityWriteClient.patch(id).unset(fieldNames).commit();
}

export async function appendToArray(id: string, field: string, items: unknown[]) {
  return sanityWriteClient
    .patch(id)
    .setIfMissing({ [field]: [] })
    .append(field, items)
    .commit();
}

export async function remove(id: string) {
  return sanityWriteClient.delete(id);
}

export async function getDoc<T extends Record<string, unknown> = Record<string, unknown>>(id: string) {
  return sanityClient.getDocument<T>(id);
}

export async function query<T = unknown>(groq: string, params?: Record<string, unknown>) {
  return sanityClient.fetch<T>(groq, params ?? {});
}

// ─── Batch operations ────────────────────────────────────────────────────────

export async function createMany(docs: SanityDoc[]) {
  const tx = sanityWriteClient.transaction();
  for (const doc of docs) {
    if (doc._id) {
      tx.createOrReplace(doc as Parameters<typeof tx.createOrReplace>[0]);
    } else {
      tx.create(doc);
    }
  }
  return tx.commit();
}

export async function patchMany(patches: { id: string; fields: Record<string, unknown> }[]) {
  const tx = sanityWriteClient.transaction();
  for (const p of patches) {
    tx.patch(p.id, (patch) => patch.set(p.fields));
  }
  return tx.commit();
}

export async function removeMany(ids: string[]) {
  const tx = sanityWriteClient.transaction();
  for (const id of ids) tx.delete(id);
  return tx.commit();
}

// ─── Typed document creators ─────────────────────────────────────────────────
// Each returns the created document. Pass an explicit _id for deterministic IDs
// (useful for seeds and cross-references), or omit for Sanity auto-IDs.

type Subject = 'english' | 'mathematics' | 'science' | 'hass' | 'arts' | 'technologies' | 'hpe' | 'languages';
type Setting = 'indoor' | 'outdoor' | 'either';
type EnergyLevel = 'calm' | 'moderate' | 'active';
type Modality = 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social' | 'exploratory';
type Domain = Subject;
type Tier = 'emerging' | 'developing' | 'demonstrating';
type Framework = 'charlotte_mason' | 'classical' | 'montessori' | 'waldorf_steiner' | 'unschooling' | 'eclectic';
type Status = 'draft' | 'published';
type StatusExt = Status | 'archived';

// ── Capability Thread ────────────────────────────────────────────────────────

interface CreateCapabilityThread {
  _id?: string;
  title: string;
  slug?: string;
  domain: Domain;
  description: string;
  dlos?: { title: string; tier: Tier; description?: string }[];
  prerequisites?: string[];
  enables?: string[];
  curriculumCodes?: string[];
}

export async function createCapabilityThread(input: CreateCapabilityThread) {
  const doc: SanityDoc = {
    _type: 'capabilityThread',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    domain: input.domain,
    description: input.description,
  };
  if (input._id) doc._id = input._id;
  if (input.dlos) {
    doc.dlos = input.dlos.map((d) => {
      const o: Record<string, unknown> = { _key: key('dlo'), title: d.title, tier: d.tier };
      if (d.description) o.description = d.description;
      return o;
    });
  }
  if (input.prerequisites) doc.prerequisites = keyedRefs(input.prerequisites);
  if (input.enables) doc.enables = keyedRefs(input.enables);
  if (input.curriculumCodes) doc.curriculumCodes = input.curriculumCodes;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Discrete Learning Objective ──────────────────────────────────────────────

interface CreateDiscreteLearningObjective {
  _id?: string;
  threadId: string;
  tier: Tier;
  descriptor: string;
  slug?: string;
  parentVersion?: string;
  badgeLevel?: 'starter' | 'intermediate' | 'advanced';
  status?: StatusExt;
}

export async function createDiscreteLearningObjective(input: CreateDiscreteLearningObjective) {
  const doc: SanityDoc = {
    _type: 'discreteLearningObjective',
    thread: ref(input.threadId),
    tier: input.tier,
    descriptor: input.descriptor,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.descriptor),
    status: input.status ?? 'published',
  };
  if (input._id) doc._id = input._id;
  if (input.parentVersion) doc.parentVersion = input.parentVersion;
  if (input.badgeLevel) doc.badgeLevel = input.badgeLevel;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Badge ────────────────────────────────────────────────────────────────────

interface CreateBadge {
  _id?: string;
  title: string;
  slug?: string;
  emoji: string;
  description: string;
  criteriaSummary: string;
  capabilityThreadIds?: string[];
  observationThreshold?: number;
  status?: StatusExt;
}

export async function createBadge(input: CreateBadge) {
  const doc: SanityDoc = {
    _type: 'badge',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    emoji: input.emoji,
    description: input.description,
    criteriaSummary: input.criteriaSummary,
    observationThreshold: input.observationThreshold ?? 3,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.capabilityThreadIds) doc.capabilityThreads = keyedRefs(input.capabilityThreadIds);
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Asset ────────────────────────────────────────────────────────────────────

type AssetKind = 'template' | 'worksheet' | 'reference' | 'card_set' | 'handout' | 'audio' | 'manipulative';
type AssetLicense = 'hearth_proprietary' | 'cc_by' | 'cc_by_sa' | 'public_domain' | 'commissioned' | 'fair_use_reference';

interface CreateAsset {
  _id?: string;
  title: string;
  slug?: string;
  kind: AssetKind;
  pageCount?: number;
  description?: string;
  printGuidance?: string;
  ageBand?: string;
  license?: AssetLicense;
  source?: string;
  sourceUrl?: string;
  tags?: string[];
  commonsTextIds?: string[];
  status?: Status;
}

export async function createAsset(input: CreateAsset) {
  const doc: SanityDoc = {
    _type: 'asset',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    kind: input.kind,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.pageCount != null) doc.pageCount = input.pageCount;
  if (input.description) doc.description = input.description;
  if (input.printGuidance) doc.printGuidance = input.printGuidance;
  if (input.ageBand) doc.ageBand = input.ageBand;
  if (input.license) doc.license = input.license;
  if (input.source) doc.source = input.source;
  if (input.sourceUrl) doc.sourceUrl = input.sourceUrl;
  if (input.tags) doc.tags = input.tags;
  if (input.commonsTextIds) doc.relatedCommonsTexts = keyedRefs(input.commonsTextIds);
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Commons Text ────────────────────────────────────────────────────────────

type CommonsKind = 'fable' | 'fairy_tale' | 'folk_tale' | 'scripture' | 'parable' | 'psalm' | 'proverb' | 'poem' | 'nursery_rhyme' | 'myth' | 'primary_source' | 'story';
type CommonsLicense = 'public_domain' | 'cc_by' | 'cc_by_sa';
type CommonsLength = 'micro' | 'short' | 'medium' | 'long';

interface CreateCommonsText {
  _id?: string;
  title: string;
  slug?: string;
  kind: CommonsKind;
  tradition?: string;
  body: string | ReturnType<typeof blockText>;
  shortBody?: string | ReturnType<typeof blockText>;
  readAloudVersion?: string | ReturnType<typeof blockText>;
  estimatedReadAloudMinutes?: number;
  length?: CommonsLength;
  readingLevel?: string;
  themes?: string[];
  moralOrLesson?: string;
  source: string;
  sourceUrl?: string;
  license?: CommonsLicense;
  assetIds?: string[];
  relatedTextIds?: string[];
  tags?: string[];
  status?: Status;
}

export async function createCommonsText(input: CreateCommonsText) {
  const doc: SanityDoc = {
    _type: 'commonsText',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    kind: input.kind,
    body: typeof input.body === 'string' ? blockText(input.body) : input.body,
    source: input.source,
    license: input.license ?? 'public_domain',
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.tradition) doc.tradition = input.tradition;
  if (input.shortBody) {
    doc.shortBody = typeof input.shortBody === 'string' ? blockText(input.shortBody) : input.shortBody;
  }
  if (input.readAloudVersion) {
    doc.readAloudVersion = typeof input.readAloudVersion === 'string' ? blockText(input.readAloudVersion) : input.readAloudVersion;
  }
  if (input.estimatedReadAloudMinutes != null) doc.estimatedReadAloudMinutes = input.estimatedReadAloudMinutes;
  if (input.length) doc.length = input.length;
  if (input.readingLevel) doc.readingLevel = input.readingLevel;
  if (input.themes) doc.themes = input.themes;
  if (input.moralOrLesson) doc.moralOrLesson = input.moralOrLesson;
  if (input.sourceUrl) doc.sourceUrl = input.sourceUrl;
  if (input.assetIds) doc.relatedAssets = keyedRefs(input.assetIds);
  if (input.relatedTextIds) doc.relatedTexts = keyedRefs(input.relatedTextIds);
  if (input.tags) doc.tags = input.tags;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Activity ─────────────────────────────────────────────────────────────────

interface MaterialInput { name: string; required?: boolean; alternative?: string }
interface FacilitatorGuidance { before?: string; during?: string; challenges?: string }
interface AssetRefInput { assetId: string; role?: 'core' | 'optional' | 'extension'; notes?: string }
interface CommonsTextRefInput { textId: string; role?: 'core' | 'optional' | 'extension'; presentationMode?: 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation'; notes?: string }

interface WorkbenchInput {
  handOffFraming: string | ReturnType<typeof blockText>;
  parentOffGuidance: string | ReturnType<typeof blockText>;
  whatTheBenchInvites: string;
  evidenceTrail: string;
  materialAssetIds: string[];
  childFacingSetupNotes?: string;
  workbenchId: string;
  capabilityThreadsSecondaryIds?: string[];
}

interface CreateActivity {
  _id?: string;
  title: string;
  slug?: string;
  approachId: string;
  summary?: string;
  instructions: string | ReturnType<typeof blockText>;
  facilitatorGuidance?: FacilitatorGuidance;
  materials?: MaterialInput[];
  assetRefs?: AssetRefInput[];
  commonsTextRefs?: CommonsTextRefInput[];
  duration?: { min: number; max: number };
  setting?: Setting;
  energyLevel?: EnergyLevel;
  modality?: Modality;
  observationPrompts?: string[];
  reflectionPrompts?: string[];
  capabilityThreadIds?: string[];
  badgeIds?: string[];
  workbench?: WorkbenchInput;
  status?: Status;
}

export async function createActivity(input: CreateActivity) {
  const doc: SanityDoc = {
    _type: 'activity',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    approach: ref(input.approachId),
    instructions: typeof input.instructions === 'string' ? blockText(input.instructions) : input.instructions,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.summary) doc.summary = input.summary;
  if (input.facilitatorGuidance) doc.facilitatorGuidance = input.facilitatorGuidance;
  if (input.materials) {
    doc.materials = input.materials.map((m) => {
      const o: Record<string, unknown> = { _key: key('mat'), name: m.name, required: m.required ?? true };
      if (m.alternative) o.alternative = m.alternative;
      return o;
    });
  }
  if (input.assetRefs) {
    doc.assets = input.assetRefs.map((a) => assetRef(a.assetId, a.role ?? 'core', a.notes));
  }
  if (input.commonsTextRefs) {
    doc.commonsTexts = input.commonsTextRefs.map((c) => commonsTextRef(c.textId, c.role ?? 'core', c.presentationMode ?? 'read_aloud', c.notes));
  }
  if (input.duration) doc.duration = input.duration;
  if (input.setting) doc.setting = input.setting;
  if (input.energyLevel) doc.energyLevel = input.energyLevel;
  if (input.modality) doc.modality = input.modality;
  if (input.observationPrompts) doc.observationPrompts = input.observationPrompts;
  if (input.reflectionPrompts) doc.reflectionPrompts = input.reflectionPrompts;
  if (input.capabilityThreadIds) doc.capabilityThreads = keyedRefs(input.capabilityThreadIds);
  if (input.badgeIds) doc.enabledBadges = keyedRefs(input.badgeIds);
  if (input.workbench) {
    const wb = input.workbench;
    const wbDoc: Record<string, unknown> = {
      handOffFraming:
        typeof wb.handOffFraming === 'string' ? blockText(wb.handOffFraming) : wb.handOffFraming,
      parentOffGuidance:
        typeof wb.parentOffGuidance === 'string'
          ? blockText(wb.parentOffGuidance)
          : wb.parentOffGuidance,
      whatTheBenchInvites: wb.whatTheBenchInvites,
      evidenceTrail: wb.evidenceTrail,
      materialAssets: keyedRefs(wb.materialAssetIds),
      workbenchId: wb.workbenchId,
    };
    if (wb.childFacingSetupNotes) wbDoc.childFacingSetupNotes = wb.childFacingSetupNotes;
    if (wb.capabilityThreadsSecondaryIds) {
      wbDoc.capabilityThreadsSecondary = keyedRefs(wb.capabilityThreadsSecondaryIds);
    }
    doc.workbench = wbDoc;
  }
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Approach ─────────────────────────────────────────────────────────────────

interface CreateApproach {
  _id?: string;
  title: string;
  slug?: string;
  moduleId: string;
  modality?: Modality;
  description?: string;
  activityIds?: string[];
  status?: Status;
}

export async function createApproach(input: CreateApproach) {
  const doc: SanityDoc = {
    _type: 'approach',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    module: ref(input.moduleId),
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.modality) doc.modality = input.modality;
  if (input.description) doc.description = input.description;
  if (input.activityIds) doc.activities = keyedRefs(input.activityIds);
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Module ───────────────────────────────────────────────────────────────────

export type CreatedVia =
  | 'material'
  | 'process'
  | 'inquiry'
  | 'retrospective'
  | 'understanding'
  | 'editorial';

interface CreateModule {
  _id?: string;
  title: string;
  slug?: string;
  targetUnderstanding: string;
  understandingIndicators?: { emerging?: string; developing?: string; demonstrating?: string };
  approachIds?: string[];
  subjects?: Subject[];
  ageRange?: { min: number; max: number };
  duration?: { min: number; max: number };
  badgeIds?: string[];
  capabilityThreadIds?: string[];
  status?: Status;
  authorFamilyId?: string;
  createdVia?: CreatedVia;
}

export async function createModule(input: CreateModule) {
  const doc: SanityDoc = {
    _type: 'module',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    targetUnderstanding: input.targetUnderstanding,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.understandingIndicators) doc.understandingIndicators = input.understandingIndicators;
  if (input.approachIds) doc.approaches = keyedRefs(input.approachIds);
  if (input.subjects) doc.subjects = input.subjects;
  if (input.ageRange) doc.ageRange = input.ageRange;
  if (input.duration) doc.duration = input.duration;
  if (input.badgeIds) doc.badges = keyedRefs(input.badgeIds);
  if (input.capabilityThreadIds) doc.capabilityThreads = keyedRefs(input.capabilityThreadIds);
  if (input.authorFamilyId) doc.authorFamilyId = input.authorFamilyId;
  if (input.createdVia) doc.createdVia = input.createdVia;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Pack ─────────────────────────────────────────────────────────────────────

interface AssetCounts {
  total: number;
  template?: number;
  worksheet?: number;
  reference?: number;
  card_set?: number;
  handout?: number;
  audio?: number;
  manipulative?: number;
}

interface PackWorkbenchInput {
  id: string;
  name: string;
  consolidatesPaths?: string[];
  physicalForm?: string;
}

interface CreatePack {
  _id?: string;
  title: string;
  slug?: string;
  description: string;
  moduleIds?: string[];
  badgeIds?: string[];
  projectIds?: string[];
  ageRange?: { min: number; max: number };
  subjects?: Subject[];
  termWeeks?: number;
  moduleCount?: number;
  totalActivities?: number;
  assetCounts?: AssetCounts;
  commonsTextCount?: number;
  workbenches?: PackWorkbenchInput[];
  worldview?: 'christian-classical' | 'secular' | 'neutral';
  availability?: 'included' | 'premium';
  creator?: string;
  version?: string;
  status?: StatusExt;
}

export async function createPack(input: CreatePack) {
  const doc: SanityDoc = {
    _type: 'pack',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    description: input.description,
    availability: input.availability ?? 'included',
    version: input.version ?? '1.0.0',
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.moduleIds) doc.modules = keyedRefs(input.moduleIds);
  if (input.badgeIds) doc.badges = keyedRefs(input.badgeIds);
  if (input.projectIds) doc.projects = keyedRefs(input.projectIds);
  if (input.ageRange) doc.ageRange = input.ageRange;
  if (input.subjects) doc.subjects = input.subjects;
  if (input.termWeeks) doc.termWeeks = input.termWeeks;
  if (input.moduleCount != null) doc.moduleCount = input.moduleCount;
  if (input.totalActivities != null) doc.totalActivities = input.totalActivities;
  if (input.assetCounts) doc.assetCounts = input.assetCounts;
  if (input.commonsTextCount != null) doc.commonsTextCount = input.commonsTextCount;
  if (input.workbenches) {
    doc.workbenches = input.workbenches.map((w) => {
      const o: Record<string, unknown> = { _key: key('wb'), id: w.id, name: w.name };
      if (w.consolidatesPaths) o.consolidatesPaths = w.consolidatesPaths;
      if (w.physicalForm) o.physicalForm = w.physicalForm;
      return o;
    });
  }
  if (input.worldview) doc.worldview = input.worldview;
  if (input.creator) doc.creator = input.creator;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Pedagogy Overlay ─────────────────────────────────────────────────────────

interface CreatePedagogyOverlay {
  _id?: string;
  title?: string;
  activityId: string;
  framework: Framework;
  lens?: {
    perspective?: string;
    facilitatorTips?: string;
    languageFrame?: string;
    watchFor?: string;
  };
  status?: Status;
}

export async function createPedagogyOverlay(input: CreatePedagogyOverlay) {
  const doc: SanityDoc = {
    _type: 'pedagogyOverlay',
    title: input.title ?? `${input.framework} overlay`,
    activity: ref(input.activityId),
    framework: input.framework,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.lens) doc.lens = input.lens;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Project ──────────────────────────────────────────────────────────────────

interface CreateProject {
  _id?: string;
  title: string;
  slug?: string;
  description?: string;
  stageIds?: string[];
  subjects?: Subject[];
  ageRange?: { min: number; max: number };
  duration?: string;
  capabilityThreadIds?: string[];
  badgeIds?: string[];
  status?: Status;
}

export async function createProject(input: CreateProject) {
  const doc: SanityDoc = {
    _type: 'project',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.description) doc.description = input.description;
  if (input.stageIds) doc.stages = keyedRefs(input.stageIds);
  if (input.subjects) doc.subjects = input.subjects;
  if (input.ageRange) doc.ageRange = input.ageRange;
  if (input.duration) doc.duration = input.duration;
  if (input.capabilityThreadIds) doc.capabilityThreads = keyedRefs(input.capabilityThreadIds);
  if (input.badgeIds) doc.badges = keyedRefs(input.badgeIds);
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Project Stage ────────────────────────────────────────────────────────────

interface CreateProjectStage {
  _id?: string;
  title: string;
  slug?: string;
  projectId?: string;
  stageNumber: number;
  instructions?: string | ReturnType<typeof blockText>;
  materials?: MaterialInput[];
  estimatedDuration?: string;
  artifactDescription?: string;
  dependsOn?: string;
  status?: Status;
}

export async function createProjectStage(input: CreateProjectStage) {
  const doc: SanityDoc = {
    _type: 'projectStage',
    title: input.title,
    slug: input.slug ? { _type: 'slug', current: input.slug } : autoSlug(input.title),
    stageNumber: input.stageNumber,
    status: input.status ?? 'draft',
  };
  if (input._id) doc._id = input._id;
  if (input.projectId) doc.project = ref(input.projectId);
  if (input.instructions) {
    doc.instructions = typeof input.instructions === 'string' ? blockText(input.instructions) : input.instructions;
  }
  if (input.materials) {
    doc.materials = input.materials.map((m) => {
      const o: Record<string, unknown> = { _key: key('mat'), name: m.name, required: m.required ?? true };
      if (m.alternative) o.alternative = m.alternative;
      return o;
    });
  }
  if (input.estimatedDuration) doc.estimatedDuration = input.estimatedDuration;
  if (input.artifactDescription) doc.artifactDescription = input.artifactDescription;
  if (input.dependsOn) doc.dependsOn = input.dependsOn;
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ─── High-level: create a full module tree ───────────────────────────────────
// Handles circular refs automatically: module shell → approach shells →
// activities → patch approach.activities → patch module.approaches

type FullActivityInput = Omit<CreateActivity, 'approachId'>;
interface FullApproachInput extends Omit<CreateApproach, 'moduleId' | 'activityIds'> {
  activities: FullActivityInput[];
}
interface FullModuleInput extends Omit<CreateModule, 'approachIds'> {
  approaches: FullApproachInput[];
}

export async function createFullModule(input: FullModuleInput) {
  const mod = await createModule(input);

  const approachResults = [];
  for (const appInput of input.approaches) {
    const approach = await createApproach({ ...appInput, moduleId: mod._id });

    const activityIds: string[] = [];
    for (const actInput of appInput.activities) {
      const activity = await createActivity({ ...actInput, approachId: approach._id });
      activityIds.push(activity._id);
    }

    await patch(approach._id, { activities: keyedRefs(activityIds) });
    approachResults.push({ ...approach, activityIds });
  }

  await patch(mod._id, { approaches: keyedRefs(approachResults.map((a) => a._id)) });

  return { module: mod, approaches: approachResults };
}
