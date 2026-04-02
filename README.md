# Hearth LMS

A learning management system for Australian homeschool families, built with Next.js 16, React 19, and TypeScript.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Demo pages are available at `/demo/dashboard` without authentication.

## Project Status

See [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for current build state, architecture decisions, and priorities.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **CMS:** Sanity
- **Auth:** Clerk
- **Styling:** Tailwind CSS v4
- **AI:** Anthropic Claude Haiku (write-time enrichment)
