import { pack } from './pack';
import { moduleSchema } from './module';
import { approach } from './approach';
import { activity } from './activity';
import { project } from './project';
import { projectStage } from './projectStage';
import { badge } from './badge';
import { capabilityThread } from './capabilityThread';
import { discreteLearningObjective } from './discreteLearningObjective';
import { capabilityDomain } from './capabilityDomain';
import { strand } from './strand';
import { atomicCapability } from './atomicCapability';
import { prerequisiteEdge } from './prerequisiteEdge';
import { regulatoryFramework } from './regulatoryFramework';
import { pedagogyOverlay } from './pedagogyOverlay';
import { pedagogicalFramework } from './pedagogicalFramework';
import { pedagogySourceExcerpt } from './pedagogySourceExcerpt';
import { pedagogyPracticePattern } from './pedagogyPracticePattern';
import { pedagogyObservationalMarker } from './pedagogyObservationalMarker';
import { pedagogyFacilitationVocabulary } from './pedagogyFacilitationVocabulary';
import { pedagogyContraindication } from './pedagogyContraindication';
import { pedagogyWorkedExample } from './pedagogyWorkedExample';
import { pedagogyLensBundle } from './pedagogyLensBundle';
import { methodologyOverlay } from './methodologyOverlay';
import { practice } from './practice';
import { lensSurfaceMap } from './lensSurfaceMap';
import { bannedPhraseSet } from './bannedPhraseSet';
import { moduleSkeleton } from './moduleSkeleton';
import { asset } from './asset';
import { commonsText } from './commonsText';
import { kit } from './kit';
import { siteCopy } from './siteCopy';

export const schemaTypes = [
  // Pedagogical Knowledge Base
  pedagogicalFramework,
  pedagogySourceExcerpt,
  pedagogyPracticePattern,
  pedagogyObservationalMarker,
  pedagogyFacilitationVocabulary,
  pedagogyContraindication,
  pedagogyWorkedExample,
  // Practices (methodology layer)
  practice,
  // Per-module bundle/overlay objects
  pedagogyLensBundle,
  methodologyOverlay,
  // Singletons
  lensSurfaceMap,
  bannedPhraseSet,
  // Site copy (one doc per surface; keys owned by src/lib/copy/defaults.ts)
  siteCopy,
  // Capability Universe v2 substrate (§3 data model)
  capabilityDomain,
  capabilityThread,
  strand,
  atomicCapability,
  prerequisiteEdge,
  regulatoryFramework,
  discreteLearningObjective,
  badge,
  asset,
  commonsText,
  kit,
  activity,
  approach,
  moduleSchema,
  pack,
  projectStage,
  project,
  pedagogyOverlay,
  moduleSkeleton,
];
