# Seeding Capability Threads into Sanity

## Overview

This guide explains how to seed all 57 capability threads from the library into Sanity CMS. The seed script generates complete capability thread documents with:

- Thread metadata (title, domain, description)
- Three-tier DLOs (Developing Learning Outcomes) with observable indicators
- Prerequisite and enables relationships for scaffolding
- Australian Curriculum V9 content descriptor mappings

## Files

| File | Purpose |
|------|---------|
| `src/scripts/seed-capability-threads.ts` | Seed script with all 57 thread definitions and seeding logic |
| `src/app/api/seed/capability-threads/route.ts` | HTTP endpoint to trigger seeding from API |

## Prerequisites

1. Sanity CLI configured and authenticated
2. `@clerk/nextjs` for auth protection
3. Sanity write client credentials (set up in `src/lib/sanity/client.ts`)

## Usage

### Method 1: Direct Script Execution

```bash
npx ts-node src/scripts/seed-capability-threads.ts
```

This will:
1. Create all 57 capability thread documents in Sanity
2. Log each created thread with its ID and title
3. Report success/failure count
4. Exit with code 0 (success) or 1 (failure)

### Method 2: HTTP Endpoint

#### Prerequisites for API usage
- User must be authenticated via Clerk
- In production: user must be in `ADMIN_CLERK_IDS` environment variable

#### Request

```bash
curl -X POST http://localhost:3000/api/seed/capability-threads \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json"
```

#### Response (Success)

```json
{
  "success": true,
  "created": 57,
  "failed": 0,
  "message": "Successfully seeded all 57 capability threads"
}
```

#### Response (With Failures)

```json
{
  "success": false,
  "created": 55,
  "failed": 2,
  "message": "Seeded 55 threads with 2 failures"
}
```

#### Response (Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### Method 3: Sanity CLI

If you prefer to use Sanity's client library directly:

```bash
sanity dataset import - --replace < seed-data.json
```

(You would need to export the THREADS data to JSON format first.)

## Thread Structure

Each thread document in Sanity has this structure:

```typescript
{
  _type: 'capabilityThread',
  _id: 'capability-thread-L1',  // Deterministic ID
  title: 'Oral Communication & Listening',
  slug: { _type: 'slug', current: 'oral-communication-listening' },
  domain: 'english',  // 'english' | 'mathematics' | 'science' | 'hass' | 'hpe' | 'arts' | 'languages' | 'technologies'
  description: '...',
  dlos: [
    {
      _key: 'dlo-xyz123',
      title: 'Listens when spoken to directly...',
      tier: 'emerging',  // 'emerging' | 'developing' | 'demonstrating'
      description: '...'
    },
    // ... developing and demonstrating tiers
  ],
  prerequisites: [
    { _key: 'ref-xyz', _ref: 'capability-thread-L3', _type: 'reference' }
  ],
  enables: [
    { _key: 'ref-abc', _ref: 'capability-thread-L5', _type: 'reference' }
  ],
  curriculumCodes: [
    'AC9EFLY01',
    'AC9EFLY02',
    // ... full list of AC V9 descriptors
  ]
}
```

## Thread Coverage

### By Domain

| Domain | Count | Threads |
|--------|-------|---------|
| Language & Literacy | 9 | L1–L9 |
| Mathematical Thinking | 9 | M1–M9 |
| Scientific Thinking | 6 | S1–S6 |
| Humanities & Social Understanding | 6 | H1–H6 |
| Physical Capability | 5 | P1–P5 |
| Personal & Social Development | 7 | PS1–PS7 |
| Creative Expression | 7 | C1–C7 |
| Executive Function & Learning | 8 | EF1–EF8 |

**Total: 57 threads**

### Thread IDs and Titles

See the complete list in `src/lib/capability-threads.ts` (THREAD_NAMES constant).

## Prerequisites & Enablement Graph

The seeding includes all prerequisite and enables relationships as defined in the library:

### Example: L1 (Oral Communication)

- **Prerequisites:** None (foundational)
- **Enables:** L3, L5, L8, PS1, C1, C3, C4

### Example: L3 (Reading Comprehension)

- **Prerequisites:** L1, L2
- **Enables:** L5, L7, L8, H1, H2, EF5

This creates a directed acyclic graph (DAG) that the constellation visualization uses to show:
- Active threads (with observations)
- Ghost nodes (prerequisites nearly met)
- Inaccessible threads (prerequisites not yet met)

## Curriculum Mapping

Each thread includes AC V9 content descriptors for year levels Foundation–Year 6+.

Example: **M1 (Number Sense & Place Value)**
```
AC9MFN01, AC9MFN02, AC9MFN03,  // Foundation
AC9M1N01, AC9M1N02,              // Year 1
AC9M2N01, AC9M2N02,              // Year 2
AC9M3N01, AC9M4N01, AC9M5N01, AC9M6N01  // Years 3–6
```

This enables:
- HEU reporting (AC V9 coverage map)
- School transfer documentation (content descriptor alignment)
- Post-secondary capability credentials

## Observables & DLOs

Each thread has 3 DLO tiers with observable indicators:

### **Emerging**
First signs of the capability. Child may need prompting or specific context. 1–3 observations noted with support.

### **Developing**
Growing consistency in supported/familiar contexts. Not yet transferring to new situations. 4–8 observations across 2+ contexts.

### **Demonstrating**
Solid capability. Demonstrated independently in novel contexts. Often explains or teaches to others. 8+ observations including novel contexts.

Example: **L1 Observable Indicators**

*Emerging:*
- Listens when spoken to directly and responds with relevant contributions
- Follows simple one-two step instructions
- Takes turns with prompting

*Developing:*
- Initiates conversation about experiences without prompting
- Asks clarifying questions
- Adjusts volume/tone for different settings

*Demonstrating:*
- Presents ideas to groups with confidence
- Adapts language for different audiences
- Sustains conversation by building on what others say

## Troubleshooting

### "Unauthorized" Error (API)

- Ensure you're authenticated with Clerk
- In production, add your user ID to `ADMIN_CLERK_IDS` env var

### "Failed to create thread X"

Check Sanity console for validation errors. Common issues:

1. **Duplicate domain value** — Ensure domain is one of: `english`, `mathematics`, `science`, `hass`, `hpe`, `arts`, `languages`, `technologies`
2. **Missing prerequisite references** — All prerequisite thread IDs must exist in Sanity
3. **Invalid curriculum codes** — Codes must follow AC V9 format

### Partial Seeding (Some threads created, some failed)

Re-run the script. It will skip existing documents (safe operation). Failing threads will retry.

### "Write client not authenticated"

Ensure `src/lib/sanity/client.ts` has valid write token:

```typescript
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,  // ← Must be set
  useCdn: false,
  apiVersion: '2024-01-01',
});
```

## After Seeding

### 1. Verify in Sanity Studio

Navigate to **Capability Threads** in your Sanity Studio. You should see 57 documents.

### 2. Check Relationships

Open any thread (e.g., L3: Reading Comprehension) and verify:
- Prerequisites link correctly to L1, L2
- Enables links correctly to L5, L7, L8, H1, H2, EF5

### 3. Curriculum Codes

Spot-check a thread (e.g., M1) to ensure curriculum codes are present:
- Foundation: AC9MFN01, AC9MFN02, AC9MFN03
- Year 1: AC9M1N01, AC9M1N02
- etc.

### 4. Query Threads

Test a GROQ query in Sanity:

```groq
*[_type == 'capabilityThread'] | order(title) {
  _id,
  title,
  domain,
  "prerequisiteCount": count(prerequisites),
  "enablesCount": count(enables),
  "dloCount": count(dlos)
}
```

Should return 57 documents.

## Integration Points

Once threads are seeded, they enable:

### Observation Tagging Engine
When parents log observations, the system suggests relevant threads by keyword matching against DLO indicators.

### Constellation Visualization
Threads form nodes in a directed graph showing:
- Active threads (with ≥1 observation)
- Ghost nodes (prerequisites developing)
- Hidden threads (not yet relevant)

### HEU Reporting
Curriculum codes map observations to AC V9 content descriptors, generating compliance reports.

### School Transfer Documents
Thread tier summaries with evidence counts demonstrate learning progression to receiving institutions.

## Development Notes

### Thread ID Convention

All thread IDs follow format: `capability-thread-{THREADCODE}`

Examples:
- `capability-thread-L1` (Oral Communication)
- `capability-thread-M5` (Measurement)
- `capability-thread-EF8` (Creative Thinking)

### Domain Mapping

Hearth domains → Sanity domain values:

| Hearth | Sanity |
|--------|--------|
| Language & Literacy | `english` |
| Mathematical Thinking | `mathematics` |
| Scientific Thinking | `science` |
| Humanities & Social Understanding | `hass` |
| Physical Capability | `hpe` |
| Personal & Social Development | `hpe` |
| Creative Expression | `arts` / `technologies` |
| Executive Function | `english` (meta-domain) |

### Future Enhancements

- [ ] Family-created custom threads (PS7: Digital Citizenship was the 57th; custom threads add beyond this)
- [ ] Age relevance ranges (`typicalEmergingAge`, `typicalDemonstratingAge`)
- [ ] Pedagogy-specific overlays (Charlotte Mason, Montessori, etc.)
- [ ] Observation keyword → thread suggestion engine
- [ ] Progressive disclosure based on child age

## Questions?

Refer to `/docs/hearth-capability-thread-library.md` for complete thread definitions, design philosophy, and implementation notes.

---

**Last updated:** 2 April 2026
**Script version:** 1.0
**Threads seeded:** 57 / 57
