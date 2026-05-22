#!/usr/bin/env node
/**
 * Programmatically rebuild missing drizzle snapshot chain (0008..0015) from
 * the current schema, without invoking drizzle-kit's interactive resolver.
 *
 * Strategy
 * --------
 * drizzle-kit's `generate` command picks `snapshots[snapshots.length - 1]` as
 * the previous snapshot for diffing against the current schema. The earlier
 * snapshots only need to:
 *   1. Exist (one per journal entry)
 *   2. Validate against the pg snapshot schema
 *   3. Form a non-colliding `prevId -> id` chain
 *
 * So we serialize the CURRENT schema once via `generateDrizzleJson` (the
 * exported, non-interactive entry point), then materialize 0008..0015 as
 * the same payload, each with a fresh uuid and chained `prevId` pointing
 * at the previous snapshot. Snapshot 0008's prevId points at 0007's id,
 * which we read from disk.
 *
 * Trade-off: historical diff fidelity for snapshots 0008..0014 is lost
 * (each "diff" against the next would be empty). All those migrations are
 * already applied to prod, so this is purely metadata cosmetics. Future
 * `drizzle-kit generate` runs diff against 0015, which is correct.
 *
 * Output:
 *   drizzle/meta/0008_snapshot.json .. drizzle/meta/0015_snapshot.json
 *   drizzle/meta/_journal.json  (entries 13, 14, 15 appended if missing)
 *
 * Backup of meta/ goes to /tmp/meta-backup-<ts>/ before any writes.
 *
 * Safe: never touches the DB. Never touches drizzle/*.sql. Pure metadata.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const META = path.join(ROOT, 'drizzle', 'meta');
const SCHEMA_PATH = path.join(ROOT, 'src', 'lib', 'db', 'schema.ts');

const MIGRATION_TAGS = {
  8: '0008_content_studio_drafts',
  9: '0009_admin_audit_invitations',
  10: '0010_logger_depth_coaching',
  11: '0011_family_library_modules',
  12: '0012_work_sample_candidate',
  13: '0013_normalize_columns',
  14: '0014_capability_universe_v2',
  15: '0015_dlo_state',
};

const TIMESTAMPS = {
  // Existing journal timestamps preserved; new ones step forward by 1ms
  // so ordering is unambiguous.
  13: 1779400000001,
  14: 1779400000002,
  15: 1779400000003,
};

async function loadSchemaExports() {
  // tsx is in devDependencies; using it as a loader lets us import schema.ts directly.
  // Use the dynamic tsImport helper (avoids global require-cycle issues that
  // the synchronous register() variant trips on with our schema's import graph).
  const { tsImport } = await import('tsx/esm/api');
  return tsImport(pathToFileURL(SCHEMA_PATH).href, import.meta.url);
}

async function main() {
  // 1. Backup
  const backupDir = `/tmp/meta-backup-${Date.now()}`;
  fs.mkdirSync(backupDir, { recursive: true });
  for (const f of fs.readdirSync(META)) {
    fs.copyFileSync(path.join(META, f), path.join(backupDir, f));
  }
  console.log(`Backed up meta/ -> ${backupDir}`);

  // 2. Load drizzle-kit API + schema
  const { generateDrizzleJson } = await import('drizzle-kit/api');
  const schemaExports = await loadSchemaExports();

  // 3. Read prevId chain anchor (0007's id)
  const snap0007 = JSON.parse(
    fs.readFileSync(path.join(META, '0007_snapshot.json'), 'utf8'),
  );
  const anchorId = snap0007.id;
  if (!anchorId) throw new Error('0007_snapshot.json has no id');

  // 4. Serialize the current schema once.
  //    tsImport returns the namespace under `.default` for our schema; unwrap.
  //    Also strip null/undefined entries — drizzle-kit's `is(...)` guard
  //    dereferences `.constructor` and crashes on null.
  const rawExports =
    schemaExports.default && Object.keys(schemaExports).length === 1
      ? schemaExports.default
      : schemaExports;
  const safeExports = Object.fromEntries(
    Object.entries(rawExports).filter(([, v]) => v != null),
  );
  const base = generateDrizzleJson(safeExports);
  // generateDrizzleJson assigns id+prevId; we will override per snapshot.
  const { id: _ignoreId, prevId: _ignorePrev, ...payload } = base;

  // 5. Materialize 0008..0015 with chained ids.
  let prevId = anchorId;
  const newSnapshots = {};
  for (let idx = 8; idx <= 15; idx++) {
    const id = randomUUID();
    newSnapshots[idx] = { ...payload, id, prevId };
    prevId = id;
  }

  // 6. Sanity check: snapshot version + dialect match 0007's.
  for (const idx of Object.keys(newSnapshots)) {
    const s = newSnapshots[idx];
    if (s.version !== snap0007.version) {
      throw new Error(
        `snapshot version mismatch at ${idx}: got ${s.version}, expected ${snap0007.version}`,
      );
    }
    if (s.dialect !== snap0007.dialect) {
      throw new Error(`dialect mismatch at ${idx}: got ${s.dialect}`);
    }
  }

  // 7. Write snapshots.
  for (const [idx, snap] of Object.entries(newSnapshots)) {
    const file = path.join(META, `${String(idx).padStart(4, '0')}_snapshot.json`);
    fs.writeFileSync(file, JSON.stringify(snap, null, 2) + '\n');
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }

  // 8. Update _journal.json — add entries 13, 14, 15 if missing.
  const journalFile = path.join(META, '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalFile, 'utf8'));
  const existingIdx = new Set(journal.entries.map((e) => e.idx));
  for (const idx of [13, 14, 15]) {
    if (existingIdx.has(idx)) continue;
    journal.entries.push({
      idx,
      version: snap0007.version,
      when: TIMESTAMPS[idx],
      tag: MIGRATION_TAGS[idx],
      breakpoints: true,
    });
  }
  journal.entries.sort((a, b) => a.idx - b.idx);
  fs.writeFileSync(journalFile, JSON.stringify(journal, null, 2) + '\n');
  console.log(`updated ${path.relative(ROOT, journalFile)}`);

  console.log('\nDone. Verify with: ls drizzle/meta/ && cat drizzle/meta/_journal.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
