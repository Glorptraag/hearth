/**
 * Derived-artifact orchestration — regenerates the three caches over the JSONL
 * register that downstream tools (and Drew) read:
 *
 *   1. `register/status-board.html` — via `summarise`+`renderHtml`
 *   2. `register/heatmap.json`     — via `buildHeatmap`+`writeHeatmap`
 *   3. `register/per-module/module-{P}-{M}.yaml` — via `writePerModuleYaml`
 *
 * Called from the orchestrator AFTER `content_constructed` fires (so the new
 * events are visible in JSONL replay). Wrapped in try/catch on the caller side
 * so a regen failure logs but does NOT reverse the bucket transition.
 *
 * In `--dry-run`, no files are written. The function returns the paths it WOULD
 * have regenerated so the close-out can surface them to Drew.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readAllEvents } from '../../register/helper';
import { summarise, renderHtml } from '../../register/build-status-board';
import { buildHeatmap, writeHeatmap } from './heatmap';
import { writePerModuleYaml, type PerModuleYamlCtx } from './per-module-yaml';
import type { ModuleSpec } from './spec-parser';

export interface DerivedArtifactPaths {
  statusBoardPath: string;
  heatmapPath: string;
  yamlPath: string;
}

/**
 * Structural shape of the orchestrator's `RunContext` (the parts this orchestrator
 * actually reads). Mirrors `PerModuleYamlCtx` plus the `dryRun` flag.
 */
export interface DerivedArtifactsCtx extends PerModuleYamlCtx {
  dryRun: boolean;
}

export async function regenerateDerivedArtifacts(
  spec: ModuleSpec,
  ctx: DerivedArtifactsCtx,
): Promise<DerivedArtifactPaths> {
  const { pack, module: mod } = parsePackModule(spec.kindlingId);
  const expectedPaths: DerivedArtifactPaths = {
    statusBoardPath: resolve(__dirname, '..', '..', 'register', 'status-board.html'),
    heatmapPath: resolve(__dirname, '..', '..', 'register', 'heatmap.json'),
    yamlPath: resolve(
      __dirname,
      '..',
      '..',
      'register',
      'per-module',
      `module-${pack}-${mod}.yaml`,
    ),
  };

  if (ctx.dryRun) {
    console.log(`  [dry-run] would regenerate derived artifacts:`);
    console.log(`    status board → ${expectedPaths.statusBoardPath}`);
    console.log(`    heatmap      → ${expectedPaths.heatmapPath}`);
    console.log(`    module YAML  → ${expectedPaths.yamlPath}`);
    return expectedPaths;
  }

  // 1. Status board — replay every event, summarise, render, write.
  const events = await readAllEvents();
  const summaries = summarise(events);
  const html = renderHtml(summaries);
  await writeFile(expectedPaths.statusBoardPath, html, 'utf8');

  // 2. Heatmap — replay activities, build, write.
  const heatmap = await buildHeatmap();
  await writeHeatmap(heatmap);

  // 3. Per-module YAML — derive from spec + ctx + replayed module events.
  await writePerModuleYaml(spec, ctx);

  return expectedPaths;
}

function parsePackModule(kindlingId: string): { pack: number; module: number } {
  const m = /^module\.(\d+)\.(\d+)\./.exec(kindlingId);
  if (!m) {
    throw new Error(
      `derived-artifacts: cannot parse pack/module indices from kindlingId \`${kindlingId}\``,
    );
  }
  return { pack: parseInt(m[1], 10), module: parseInt(m[2], 10) };
}
