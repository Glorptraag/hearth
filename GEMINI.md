# Hearth (Hearth LMS)

Hearth is a Learning Management System (LMS) designed specifically for Australian homeschool families, with a focus on Queensland (HEU) compliance. It emphasizes **retrospective logging**, where parents document learning as it happens, rather than rigid forward planning.

## Core Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Authentication:** [Clerk](https://clerk.com/) (Family account model)
- **Database:** [Neon](https://neon.tech/) (Serverless PostgreSQL) with [Drizzle ORM](https://orm.drizzle.team/)
- **CMS:** [Sanity](https://www.sanity.io/) (Headless content management)
- **AI:** [Anthropic SDK](https://www.anthropic.com/) (Claude Haiku for "Family Intelligence Snapshots")
- **Styling:** Tailwind CSS v4 (Custom theme: "Mont Blanc Dark Coffee")

## Project Structure

- `src/app/`: Next.js App Router (Auth-protected routes in `(auth)/`, public in `(public)/`)
- `src/components/`: UI components organized by feature (dashboard, planner, learner, etc.)
- `src/lib/db/`: Database schema (`schema.ts`), connection (`index.ts`), and seed scripts
- `src/lib/capability-threads.ts`: Core domain model for learning domains (Literacy, Math, Science, etc.)
- `src/sanity/`: Sanity CMS schemas and configuration
- `docs/`: Extensive project documentation, specifications, and architecture decisions
- `prototypes/`: Legacy HTML/JSX prototype files (used as reference for the Next.js transition)
- `drizzle/`: SQL migration files

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- [Neon](https://neon.tech/) Database URL
- [Clerk](https://clerk.com/) API Keys
- [Sanity](https://www.sanity.io/) Project ID & Dataset

### Environment Variables

Create a `.env.local` file with the following:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
ANTHROPIC_API_KEY=
```

### Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npx drizzle-kit push # Push schema changes to the database
npx drizzle-kit studio # Open Drizzle Studio to view data
```

## Engineering Standards & Conventions

### Design System: "Mont Blanc Dark Coffee"
- **Tokens:** Defined in `docs/hearth-canonical-design-tokens-v1.md`.
- **Implementation:** Custom Tailwind v4 utility classes and CSS variables in `globals.css`.
- **Theme:** Dual-theme architecture (Dark default + Gathering mode) via `data-theme` attribute on `<html>`.
- **Typography:** Serif (Crimson Text) for titles; Sans (Inter) for buttons, nav, labels, and metadata.

### Data Model
- **Families:** The primary unit of account.
- **Learners:** Children within a family (represented by abstract shapes/colors).
- **Learning Entries:** The "Log" - central source of truth for evidenced learning.
- **Capability Threads:** Domains (L, M, S, H, P, PS, C, EF) used for tracking progress against HEU requirements.

### Principles
- **5-Minute Rule:** Every parent interaction must be completable in under 5 minutes.
- **Retrospective-First:** Log what *did* happen, not just what was planned.
- **Philosophy-Neutral:** Content is separate from pedagogical interpretation.
- **Gentle Friend Tone:** Professional but warm and supportive, never clinical.

## Key Documentation (Must Read)

- `docs/PROJECT_STATUS.md`: Current state, priorities, and roadmap.
- `docs/Hearth_System_Interaction_Map.md`: Detailed navigation flows and data relationships.
- `docs/hearth-canonical-design-tokens-v1.md`: Source of truth for all UI values.
- `docs/Hearth_AI_Intelligence_Layer_Architecture.md`: How AI transforms logs into insights.
- `docs/hearth-claude-code-transition-plan-v1.md`: 7-phase plan for the Next.js build (all phases complete).
