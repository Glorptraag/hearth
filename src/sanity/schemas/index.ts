import { pack } from './pack';
import { moduleSchema } from './module';
import { approach } from './approach';
import { activity } from './activity';
import { project } from './project';
import { projectStage } from './projectStage';
import { badge } from './badge';
import { capabilityThread } from './capabilityThread';
import { pedagogyOverlay } from './pedagogyOverlay';
import { pedagogicalFramework } from './pedagogicalFramework';
import { pedagogySourceExcerpt } from './pedagogySourceExcerpt';
import { pedagogyPracticePattern } from './pedagogyPracticePattern';
import { pedagogyObservationalMarker } from './pedagogyObservationalMarker';
import { pedagogyFacilitationVocabulary } from './pedagogyFacilitationVocabulary';
import { pedagogyContraindication } from './pedagogyContraindication';
import { pedagogyWorkedExample } from './pedagogyWorkedExample';
import { moduleSkeleton } from './moduleSkeleton';
import { asset } from './asset';
import { commonsText } from './commonsText';

export const schemaTypes = [
  // Pedagogical Knowledge Base
  pedagogicalFramework,
  pedagogySourceExcerpt,
  pedagogyPracticePattern,
  pedagogyObservationalMarker,
  pedagogyFacilitationVocabulary,
  pedagogyContraindication,
  pedagogyWorkedExample,
  // Curriculum content
  capabilityThread,
  badge,
  asset,
  commonsText,
  activity,
  approach,
  moduleSchema,
  pack,
  projectStage,
  project,
  pedagogyOverlay,
  moduleSkeleton,
];
