/**
 * Sanity Status Migration: draft → created, published → active
 *
 * Run: npx tsx scripts/migrate-statuses.ts
 * Safe to run multiple times — only patches documents that still have old values.
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const TYPES = ['pack', 'module', 'approach', 'activity', 'badge', 'pedagogyOverlay', 'project', 'projectStage']

const MIGRATIONS: [string, string][] = [
  ['draft', 'created'],
  ['published', 'active'],
]

async function migrate() {
  let totalPatched = 0

  for (const [oldStatus, newStatus] of MIGRATIONS) {
    const ids: string[] = await client.fetch(
      `*[_type in $types && status == $oldStatus]._id`,
      { types: TYPES, oldStatus }
    )

    if (ids.length === 0) {
      console.log(`  ${oldStatus} → ${newStatus}: 0 documents (nothing to do)`)
      continue
    }

    const tx = client.transaction()
    for (const id of ids) {
      tx.patch(id, (p) => p.set({ status: newStatus }))
    }
    await tx.commit()

    console.log(`  ${oldStatus} → ${newStatus}: ${ids.length} documents patched`)
    totalPatched += ids.length
  }

  console.log(`\nDone. ${totalPatched} documents migrated.`)
}

console.log('Migrating Sanity content statuses...\n')
migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
