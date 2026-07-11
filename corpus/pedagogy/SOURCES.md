# Source Registry — Human View

Machine registry: [sources.json](sources.json) (that file is authoritative; this one is for browsing). Licence strategy of record: `docs/hearth-pedagogy-corpus-licensing-needs-v2.md`.

| Key | Work | Licence | Verbatim? |
|---|---|---|---|
| `cm-home-education-1906` | Mason, *Home Education* (1906, PG #71087) | public domain | ✅ |
| `montessori-method-1912` | Montessori, *The Montessori Method* (1912, PG #39863) | public domain | ✅ |
| `montessori-own-handbook-1914` | Montessori, *Dr. Montessori's Own Handbook* (1914, PG #29635) | public domain | ✅ |
| `steiner-education-of-the-child-1911` | Steiner, *The Education of Children…* (1911 Rajput, PG #55586) | public domain | ✅ |
| `gray-riley-2015-report-i` | Gray & Riley, Grown Unschoolers Report I (2015) | CC BY 3.0 | ✅ |
| `gray-riley-2015-report-ii` | Gray & Riley, Grown Unschoolers Report II (2015) | CC BY 3.0 | ✅ |
| `gray-riley-2013-challenges-benefits` | Gray & Riley, 232 Families (2013) | CC BY-NC-ND 4.0 | ❌ reference/paraphrase only |
| `gray-2010-children-teach-themselves-read` | Gray, Psychology Today column (2010) | in copyright | ❌ paraphrase only |
| `holt-how-children-fail-learn` | Holt, *How Children Fail* / *How Children Learn* | in copyright (Hachette) | ❌ paraphrase only |
| `neill-summerhill-1960` | Neill, *Summerhill* (1960) | in copyright | ❌ paraphrase only |
| `illich-deschooling-1971` | Illich, *Deschooling Society* (1971) | in copyright | ❌ paraphrase only |
| `dodd-strewing` | Dodd, sandradodd.com (term origin, 1990s) | in copyright | ❌ paraphrase only |
| `unschooling-movement-consensus` | Community guidelines, no single source | in copyright (conservative) | ❌ paraphrase only |

## Adding a source

Add the key to `sources.json` with `author/title/year/licence/allowVerbatim` (+ `url`, `notes`). Licence classes: `public_domain`, `cc_by`, `cc_by_nc_nd`, `in_copyright`, `licensed`, `commissioned`. When Drew licenses a work or a commissioned author signs (PKB12/PKB13 — Laricchia / Patterson / Elvis / Dawson), register it as `licensed` / `commissioned` with `allowVerbatim: true` and the agreement reference in `notes` — that single registry edit is what unlocks verbatim use for every entry citing it.
