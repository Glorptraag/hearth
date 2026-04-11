import { pack } from './pack';
import { moduleSchema } from './module';
import { approach } from './approach';
import { activity } from './activity';
import { project } from './project';
import { projectStage } from './projectStage';
import { badge } from './badge';
import { capabilityThread } from './capabilityThread';
import { pedagogyOverlay } from './pedagogyOverlay';
import { moduleSkeleton } from './moduleSkeleton';
import { asset } from './asset';
import { commonsText } from './commonsText';

export const schemaTypes = [
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
