/**
 * Site copy — client-safe entry point.
 *
 *   Server components / route handlers: `import { getCopy } from '@/lib/copy/server'`
 *   Client components:                  `import { useCopy, formatCopy } from '@/lib/copy'`
 *
 * See docs/hearth-site-copy-system-v1.md.
 */
export {
  COPY_DEFAULTS,
  COPY_SURFACES,
  siteCopyDocId,
  type CopyBundle,
  type CopyKey,
  type CopySurface,
} from './defaults';
export {
  copyValue,
  defaultBundle,
  formatCopy,
  isCopySurface,
  normaliseSiteCopyRows,
  resolveCopy,
  type CopyOverrides,
  type SiteCopyRow,
} from './resolve';
export { CopyProvider, useCopy } from './CopyProvider';
