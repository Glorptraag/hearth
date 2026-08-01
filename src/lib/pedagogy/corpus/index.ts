export * from './types';
export { parseFrontmatter, serialiseFrontmatter } from './frontmatter';
export { parseEntry, parseListSection, parsePairListSection, LAYER_CONTRACTS } from './parse';
export { parseSourceRegistry, checkLicenceGate } from './registry';
export { parseTagRegistry, buildAliasMap } from './tags';
export type { TagRegistry, TagRegistryEntry, TagCategory } from './tags';
export { compileEntry } from './compile';
export { compileVault, formatCoverage, DEFAULT_VAULT_ROOT } from './vault';
