# Hearth Corpus

Durable, git-versioned knowledge corpora that compile into Hearth's runtime stores.

| Directory | What it is | Compiles to |
|---|---|---|
| [pedagogy/](pedagogy/README.md) | Pedagogy Knowledge Base corpus vault — six layers per tradition, licence-gated | Sanity PKB documents → `pedagogy_knowledge_chunks` (pgvector) |

Design intent: one file = one entry = one Sanity document. Every directory carries a README that says what lives in it and how it flows downstream, so both humans and LLM sessions can navigate top-down without reading everything. The vault is a valid Obsidian vault — open `corpus/` in Obsidian to browse entries and follow `[[wikilinks]]` between them.
