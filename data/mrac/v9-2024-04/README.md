# MRAC v9 — 2024-04 release

Australian Curriculum V9 machine-readable manifests (RDF/XMP), supplied by ACARA.
Vocabulary base URI: `http://vocabulary.curriculum.edu.au/MRAC/2024/04/`.
`dcterms:modified`: 2024-04-22T01:16:51.365Z (root description: "Corrected html tags").
`dcterms:rightsHolder`: Australian Curriculum, Assessment and Reporting Authority.

These files are reference data. The Wave 2+ ingestion pipeline reads from this
directory; nothing in the runtime app should import them. Treat as
append-only — new ACARA releases land in sibling `v9-YYYY-MM/` directories,
old releases are kept for audit / re-resolution of historical observations.

## Inventory

| File | Top-level type | Title | Size |
|------|----------------|-------|------|
| `A_TSI.rdf.xmp` | Cross-Curriculum Priority (CCP) | Aboriginal and Torres Strait Islander Histories and Cultures | 29 KB |
| `AA.rdf.xmp` | Cross-Curriculum Priority (CCP) | Asia and Australia's Engagement with Asia | 21 KB |
| `ART.rdf.xmp` | Learning Area (LA) | The Arts | 3.7 MB |
| `CCT.rdf.xmp` | General Capability (GC) | Critical and Creative Thinking | 299 KB |
| `DL.rdf.xmp` | General Capability (GC) | Digital Literacy | 337 KB |

## Mapping into Hearth schemas

- **`ART.rdf.xmp`** contains the only Learning Area, and is therefore the only file
  that carries Achievement Standard statements in the sense modelled by
  `src/sanity/schemas/achievementStandard.ts` (§7 of the Capability Universe v2
  spec). Wave 2 ingestion targets this file first.
- **CCPs (`A_TSI`, `AA`)** and **GCs (`CCT`, `DL`)** are different curriculum
  substrates. The Capability Universe v2 spec does not yet have a doc-type slot
  for them. Flagged as a future wave: a `curriculumCrossCutter` (or two distinct
  doc types) will be added once cross-cutter integration is designed.
- The H6 First Nations migration row in
  `docs/hearth-v1-to-v2-thread-migration-table-v1.md` will eventually consume
  `A_TSI.rdf.xmp` content for cross-domain atom authoring.

## Re-fetch source

ACARA MRAC root: `https://rdf.australiancurriculum.edu.au/` (per-element
manifest URIs visible in `dcterms:source` and `rdf:about` attributes inside
each file). Re-fetch is currently blocked from sandboxed CI but works from
authoring environments.
