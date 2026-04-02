# Capability Threads — Quick Start Guide

All 57 capability threads are now ready to seed into Sanity.

## TL;DR

```bash
# Option 1: Direct TypeScript execution
npx ts-node src/scripts/seed-capability-threads.ts

# Option 2: HTTP API (requires Clerk auth)
curl -X POST http://localhost:3000/api/seed/capability-threads
```

## Files Created

| File | Purpose | LOC |
|------|---------|-----|
| `src/scripts/seed-capability-threads.ts` | Seed script with all 57 threads | 2,416 |
| `src/app/api/seed/capability-threads/route.ts` | HTTP endpoint | 56 |
| `SEED_CAPABILITY_THREADS.md` | Full documentation | N/A |

## What Gets Seeded

✓ **57 capability threads** across 8 domains
✓ **3-tier DLOs** (observable indicators for emerging/developing/demonstrating)
✓ **Prerequisite relationships** (52 directed edges in scaffolding graph)
✓ **Enables relationships** (cross-domain learning paths)
✓ **AC V9 curriculum codes** (for HEU reporting and school transfer)

## Domains & Thread Count

| Domain | Threads | IDs |
|--------|---------|-----|
| Language & Literacy | 9 | L1–L9 |
| Mathematical Thinking | 9 | M1–M9 |
| Scientific Thinking | 6 | S1–S6 |
| Humanities & Social Understanding | 6 | H1–H6 |
| Physical Capability | 5 | P1–P5 |
| Personal & Social Development | 7 | PS1–PS7 |
| Creative Expression | 7 | C1–C7 |
| Executive Function & Learning | 8 | EF1–EF8 |
| **TOTAL** | **57** | |

## Thread Structure (Sanity Schema)

```typescript
{
  _type: 'capabilityThread',
  _id: 'capability-thread-L1',
  title: 'Oral Communication & Listening',
  slug: { _type: 'slug', current: 'oral-communication-listening' },
  domain: 'english',
  description: '...',
  dlos: [
    {
      _key: 'dlo-xyz',
      title: '...',
      tier: 'emerging' | 'developing' | 'demonstrating',
      description: '...'
    }
  ],
  prerequisites: [{ _ref: 'capability-thread-L2', ... }],
  enables: [{ _ref: 'capability-thread-L3', ... }],
  curriculumCodes: ['AC9EFLY01', 'AC9EFLY02', ...]
}
```

## DLO Tiers Explained

### Emerging
Child begins engaging with concept. May need prompting. 1–3 observations.

### Developing
Growing consistency in supported contexts. 4–8 observations across 2+ contexts.

### Demonstrating
Solid capability. Independent, novel contexts. 8+ observations.

## Example: L3 (Reading Comprehension)

**Prerequisites:** L1, L2
**Enables:** L5, L7, L8, H1, H2, EF5

**Emerging indicator:**
> Points to pictures that match text. Answers "what happened?" questions.

**Developing indicator:**
> Predicts what happens next based on clues. Retells story with beginning, middle, end.

**Demonstrating indicator:**
> Compares ideas across multiple texts. Identifies author purpose. Uses text evidence for interpretation.

## Scaffolding Graph

The threads form a directed acyclic graph (DAG):

```
Foundational threads (no prerequisites):
  L1, M1, M6, P1, P2, PS3

High-impact enablers (unlock most downstream threads):
  L1 enables 8 direct threads → 25+ total downstream
  M1 enables 6 direct threads → 18+ total downstream
  EF1 enables 5 direct threads → all learning threads
```

This enables:
- **Progressive disclosure** in the UI (hide threads not yet relevant)
- **Ghost nodes** in constellation (show upcoming threads as prerequisites develop)
- **Scaffolding recommendations** (suggest next learning steps)

## Curriculum Mapping

Each thread maps to AC V9 content descriptors:

- **Example M1** maps to: AC9MFN01–03, AC9M1N01–02, AC9M2N01–02, AC9M3N01, AC9M4N01, AC9M5N01, AC9M6N01

This enables:
- HEU compliance reporting
- School transfer documentation
- Post-secondary capability credentials

## Post-Seeding Verification

### 1. In Sanity Studio
Navigate to **Capability Threads** → Should see 57 documents

### 2. GROQ Query
```groq
*[_type == 'capabilityThread'] | order(title) { _id, title, domain }
```
Should return 57 results

### 3. Check One Thread
Open `capability-thread-L3` → Verify:
- Prerequisites: L1, L2 ✓
- Enables: L5, L7, L8, H1, H2, EF5 ✓
- DLOs: 3 (emerging, developing, demonstrating) ✓
- Curriculum codes: 14 AC V9 descriptors ✓

## Usage in Application

Once seeded, these threads power:

1. **Observation Tagging**
   - Parent logs entry: "She read a chapter book independently today"
   - System suggests: L3 (Reading Comprehension) as primary thread

2. **Constellation Visualization**
   - Shows active threads (≥1 observation)
   - Shows ghost nodes (prerequisites developing)
   - Hides inaccessible threads (not yet relevant)

3. **HEU Reporting**
   - Coverage map: Which AC V9 descriptors observed?
   - Evidence table: N observations for each descriptor

4. **School Transfer**
   - Tier summary with evidence highlights
   - Formal capability report for receiving school

## Troubleshooting

**"Write client not authenticated"**
→ Set `SANITY_API_TOKEN` in `.env.local`

**"Unauthorized" (API endpoint)**
→ Ensure authenticated with Clerk; in production add user to `ADMIN_USER_IDS`

**Some threads created, some failed**
→ Re-run script; it will skip existing docs and retry failures

**Can't find threads in Sanity**
→ Check dataset name and project ID match your `.env`

## References

- Full library definitions: `/docs/hearth-capability-thread-library.md`
- Thread connections: `src/lib/capability-threads.ts` (THREAD_CONNECTIONS)
- Schema definition: `src/sanity/schemas/capabilityThread.ts`
- Detailed guide: `SEED_CAPABILITY_THREADS.md`

## Next Steps

After seeding:

1. ✓ Verify all 57 threads appear in Sanity
2. Test observation tagging engine against library
3. Build constellation visualization component
4. Create HEU reporting queries
5. Build school transfer document generator

---

**Ready to go!** Run the seed script and you'll have a complete capability progression framework in Sanity.
