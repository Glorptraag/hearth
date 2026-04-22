import { sanityWriteClient, sanityClient } from './client';
import { autoSlug, ref, keyedRefs, key, blockText, assetRef as assetRefHelper, commonsTextRef as commonsTextRefHelper, slugify } from './helpers';

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
type AssetKind = 'template' | 'worksheet' | 'reference' | 'card_set' | 'handout' | 'audio' | 'manipulative';
type AgeBand = '5-7' | '7-9' | '9-12' | '12-15' | 'all';
type AssetLicense = 'hearth_proprietary' | 'cc_by' | 'cc_by_sa' | 'public_domain' | 'commissioned' | 'fair_use_reference';
type CommonsTextKind = 'fable' | 'fairy_tale' | 'folk_tale' | 'scripture' | 'parable' | 'psalm' | 'proverb' | 'poem' | 'nursery_rhyme' | 'myth' | 'primary_source' | 'story';
type CommonsTextLicense = 'public_domain' | 'cc_by' | 'cc_by_sa';
type TextLength = 'micro' | 'short' | 'medium' | 'long';
type AssetRole = 'core' | 'optional' | 'extension';
type PresentationMode = 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation';
type ReadingLevel = '5-7' | '7-9' | '9-12' | '12-15';

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

// ── Activity ─────────────────────────────────────────────────────────────────

interface MaterialInput { name: string; required?: boolean; alternative?: string }
interface FacilitatorGuidance { before?: string; during?: string; challenges?: string }

interface AssetRefInput { assetId: string; role: AssetRole; notes?: string }
interface CommonsTextRefInput { textId: string; role: AssetRole; presentationMode: PresentationMode; notes?: string }

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
    doc.assets = input.assetRefs.map((a) => assetRefHelper(a.assetId, a.role, a.notes));
  }
  if (input.commonsTextRefs) {
    doc.commonsTexts = input.commonsTextRefs.map((t) => commonsTextRefHelper(t.textId, t.role, t.presentationMode, t.notes));
  }
  if (input.duration) doc.duration = input.duration;
  if (input.setting) doc.setting = input.setting;
  if (input.energyLevel) doc.energyLevel = input.energyLevel;
  if (input.modality) doc.modality = input.modality;
  if (input.observationPrompts) doc.observationPrompts = input.observationPrompts;
  if (input.reflectionPrompts) doc.reflectionPrompts = input.reflectionPrompts;
  if (input.capabilityThreadIds) doc.capabilityThreads = keyedRefs(input.capabilityThreadIds);
  if (input.badgeIds) doc.enabledBadges = keyedRefs(input.badgeIds);
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
  return input._id ? createWithId(doc as SanityDoc & { _id: string }) : create(doc);
}

// ── Pack ─────────────────────────────────────────────────────────────────────

interface AssetCounts {
  template: number;
  worksheet: number;
  reference: number;
  card_set: number;
  handout: number;
  audio: number;
  manipulative: number;
  total: number;
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

// ── Asset ────────────────────────────────────────────────────────────────────

interface CreateAsset {
  _id?: string;
  title: string;
  slug?: string;
  kind: AssetKind;
  fileRef?: string;
  thumbnailRef?: string;
  pageCount?: number;
  description?: string;
  printGuidance?: string;
  ageBand?: AgeBand;
  license: AssetLicense;
  source?: string;
  sourceUrl?: string;
  tags?: string[];
  relatedCommonsTextIds?: string[];
  status?: Status;
  version?: number;
}

export async function createAsset(input: CreateAsset) {
  const s = input.slug ?? slugify(input.title);
  const id = input._id ?? `asset.${input.kind}.${s}`;
  const doc: SanityDoc & { _id: string } = {
    _type: 'asset',
    _id: id,
    title: input.title,
    slug: { _type: 'slug', current: s },
    kind: input.kind,
    license: input.license,
    status: input.status ?? 'draft',
    version: input.version ?? 1,
  };
  if (input.fileRef) doc.file = { _type: 'file', asset: { _type: 'reference', _ref: input.fileRef } };
  if (input.thumbnailRef) doc.thumbnail = { _type: 'image', asset: { _type: 'reference', _ref: input.thumbnailRef } };
  if (input.pageCount != null) doc.pageCount = input.pageCount;
  if (input.description) doc.description = input.description;
  if (input.printGuidance) doc.printGuidance = input.printGuidance;
  if (input.ageBand) doc.ageBand = input.ageBand;
  if (input.source) doc.source = input.source;
  if (input.sourceUrl) doc.sourceUrl = input.sourceUrl;
  if (input.tags) doc.tags = input.tags;
  if (input.relatedCommonsTextIds) doc.relatedCommonsTexts = keyedRefs(input.relatedCommonsTextIds);
  return createWithId(doc);
}

// ── Commons Text ─────────────────────────────────────────────────────────────

interface CreateCommonsText {
  _id?: string;
  title: string;
  slug?: string;
  kind: CommonsTextKind;
  tradition: string;
  body?: string | ReturnType<typeof blockText>;
  shortBody?: string | ReturnType<typeof blockText>;
  readAloudVersion?: string | ReturnType<typeof blockText>;
  estimatedReadAloudMinutes?: number;
  length?: TextLength;
  readingLevel?: ReadingLevel;
  themes?: string[];
  moralOrLesson?: string;
  source?: string;
  sourceUrl?: string;
  license: CommonsTextLicense;
  relatedAssetIds?: string[];
  relatedTextIds?: string[];
  tags?: string[];
  status?: Status;
}

export async function createCommonsText(input: CreateCommonsText) {
  const s = input.slug ?? slugify(input.title);
  const id = input._id ?? `commons.${input.tradition}.${s}`;
  const toBlock = (v: string | ReturnType<typeof blockText>) => typeof v === 'string' ? blockText(v) : v;
  const doc: SanityDoc & { _id: string } = {
    _type: 'commonsText',
    _id: id,
    title: input.title,
    slug: { _type: 'slug', current: s },
    kind: input.kind,
    tradition: input.tradition,
    license: input.license,
    status: input.status ?? 'draft',
  };
  if (input.body) doc.body = toBlock(input.body);
  if (input.shortBody) doc.shortBody = toBlock(input.shortBody);
  if (input.readAloudVersion) doc.readAloudVersion = toBlock(input.readAloudVersion);
  if (input.estimatedReadAloudMinutes != null) doc.estimatedReadAloudMinutes = input.estimatedReadAloudMinutes;
  if (input.length) doc.length = input.length;
  if (input.readingLevel) doc.readingLevel = input.readingLevel;
  if (input.themes) doc.themes = input.themes;
  if (input.moralOrLesson) doc.moralOrLesson = input.moralOrLesson;
  if (input.source) doc.source = input.source;
  if (input.sourceUrl) doc.sourceUrl = input.sourceUrl;
  if (input.relatedAssetIds) doc.relatedAssets = keyedRefs(input.relatedAssetIds);
  if (input.relatedTextIds) doc.relatedTexts = keyedRefs(input.relatedTextIds);
  if (input.tags) doc.tags = input.tags;
  return createWithId(doc);
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
