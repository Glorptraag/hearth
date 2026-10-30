<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 01 — Platform and services

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

Hearth is a single web application. Parents use it in a browser (phone first) and it can be installed to a home screen. It is built with **Next.js** and hosted on **Vercel**. It relies on a small set of outside services, each doing one job: **Clerk** handles sign-in, **Neon** stores family data in a Postgres database, **Sanity** stores the learning content, **Anthropic** (Claude Haiku) provides the AI, **Vercel Blob** stores photos, **Deepgram** handles voice, **Sentry** catches errors, and **PostHog** records anonymous usage. During the pilot, everything except the AI runs on free tiers. The AI costs roughly **$40 a month** for 20 families.

## How the pieces fit

```
             Parent's phone / browser
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Hearth web app (Next.js)    │   hosted on Vercel
        │   screens + API routes        │
        └───────────────────────────────┘
           │        │        │        │         │
           ▼        ▼        ▼        ▼         ▼
        Clerk     Neon     Sanity  Anthropic  Vercel Blob
      (sign-in) (family  (content) (AI, at    (photos &
                  data)            save time) documents)

   Alongside: Deepgram (voice) · Sentry (errors) · PostHog (usage) · GitHub (code + automated tests)
```

### What each service does, and what breaks without it

| Service | Job | If it goes down… | Tier / cost (pilot) |
|---|---|---|---|
| **Vercel** | Hosts the app, runs the API, runs scheduled jobs ("crons"), deploys every change merged to `main` | Hearth is offline | Hobby (free) |
| **Neon** (Postgres) | Stores everything about a family: children, entries, snapshots, reports, settings. Has point-in-time recovery | Hearth loads but nothing family-specific works; saves fail | Free; 6-hour recovery window |
| **Clerk** | Sign-in, sign-up, sessions, user identity | Nobody can sign in. People already signed in keep working until their session expires | Free |
| **Sanity** | Stores the content library (packs, modules, activities), the capability framework (threads, DLOs), and the pedagogy knowledge base | Library, module pages and the Constellation's descriptions can't load. Logging still works | Free |
| **Anthropic** (Claude Haiku) | Reads each saved entry once in the background and adds structure (subjects, threads, objectives, insights) | Entries still save. Insights don't appear, and the entry is marked "couldn't add insights" so the parent can retry. See [03](./03-the-learning-cycle.md) | Pay-as-you-go, ~$2 per family per month |
| **Vercel Blob** | Stores evidence photos and documents | Photo upload fails. Text entries are unaffected | Free allotment |
| **Deepgram** | Turns a voice clip into text in the Logger; produces read-aloud audio for content | The microphone button fails. Typing still works | Metered, pennies per month |
| **Voyage AI** | Turns pedagogy passages into searchable vectors | Only matters when the knowledge base is re-indexed. **Off by default** | Off |
| **Sentry** | Collects errors from the app and the background AI jobs | Errors go unreported; the app itself is unaffected | Free |
| **PostHog** | Anonymous product analytics (which features are used). Family IDs are hashed and entry text is never sent | No analytics; the app is unaffected | Free |
| **Stripe** | Card payments for paid content packs, **web only** | Pack purchase fails. Everything else is unaffected | Per-transaction |
| **GitHub** | Source code, pull requests, and the automated test run on every change | Development pauses. Production is unaffected | Free |

Full rationale, alternatives considered, and the thresholds at which each free tier runs out are in [`docs/external-services-guide.md`](../external-services-guide.md).

## The two data homes

The single most important architectural boundary to understand:

| | **Sanity** (content) | **Postgres / Neon** (family data) |
|---|---|---|
| Holds | Packs, modules, approaches, activities, projects, badges, the capability framework (15 domains, 57 threads, 171 DLOs), the pedagogy knowledge base | Families, children, entries, evidence, snapshots, reports, work samples, settings, notifications, module runs, planner, payments, audit log |
| Shared? | Yes. The same content serves every family | No. Every row belongs to exactly one family |
| Edited by | Drew in Sanity Studio, an external content-building pipeline ("kindling"), and parents publishing their own modules from the Module Builder | Parents, through the app |
| Count (at `e6ca4b5`) | 19 document types | 41 tables, plus one vector table for the pedagogy knowledge base |

**Rule:** user data never goes into Sanity, and reusable content never goes into Postgres. If a support question involves "content looks wrong for *everyone*", it's a Sanity question. If it's "something's wrong for *this family*", it's a Postgres question.

## How a change reaches production

1. A change is made on a branch and opened as a pull request on GitHub.
2. GitHub runs four checks automatically: **lint** (style), **typecheck**, **unit tests**, and **integration tests** against a real throwaway Postgres database.
3. When the pull request is merged into `main`, Vercel builds and deploys it. As part of every build, **database migrations run first** (`npm run db:migrate:deploy && next build`). A migration that fails stops the deploy, so the database and the code can't drift apart.
4. Only `main` deploys automatically. Other branches don't.

Step 3 exists because of two real incidents (25 May and 6 June 2026). In both, a database change that hadn't been applied broke the app or silently emptied a screen. Both are written up in [`docs/incident-runbook.md`](../incident-runbook.md) §7.

## Where it lives

| Thing | Location |
|---|---|
| Screens | `src/app/(auth)/…` (signed-in), `src/app/(public)/…` (landing, onboarding), `src/app/(admin)/…` (admin) |
| API | `src/app/api/…` (100+ route files) |
| Database schema | `src/lib/db/schema.ts`; migrations in `drizzle/` |
| Content schemas | `src/sanity/schemas/` |
| Deploy and cron config | `vercel.json` |
| Environment variables (secrets, flags) | Vercel → Project → Settings → Environment Variables. The list is in [`docs/deployment-runbook.md`](../deployment-runbook.md) §1.2 |
| Automated checks | `.github/workflows/test.yml` |

## What can go wrong

| Symptom | Likely cause | First move |
|---|---|---|
| Whole site down | Vercel outage, or a bad deploy | Check the Vercel status page. If it's a bad deploy, roll back (see [08](./08-operations-and-support.md#kill-switches)) |
| White screen on every page right after a deploy | Database migration not applied | Check the Vercel build log for the migrate step. Incident 2026-05-25 |
| Users stuck on an old version after a fix | The installed app shell (service worker) is serving cached files | Set `NEXT_PUBLIC_DISABLE_SW=1` and redeploy. Rolling back alone does **not** clear it |
| Nobody can sign in | Clerk outage | Check the Clerk status page. Nothing to do on our side |
| Library or module pages empty for everyone | Sanity outage, or a content publishing error | Check the Sanity status page, then `/admin/content/qa` |

## Status and known gaps

- **Single region.** Hearth runs in one Vercel region. Rate limiting relies on this (see [08](./08-operations-and-support.md)).
- **Neon recovery window is 6 hours** on the free tier. A data problem noticed more than 6 hours later cannot be rolled back with point-in-time recovery. The paid tier ($19/month) extends this to 7 days.
- **Installable app, not yet a store app.** An iOS app is being built in Swift alongside the web app (`apple/`; plan [`docs/hearth-native-ios-plan-v2.md`](../hearth-native-ios-plan-v2.md)). It shows some web pages inside itself. Those pages are recognised by the `HearthNative` user agent and render without the web's navigation and without any Stripe purchase option, because the app sells packs through Apple only. Routes the app reads must change additively. `NATIVE_MIN_SUPPORTED_BUILD` (served by `GET /api/native/config`, default 1) is the update gate: app builds below it show an update screen. Raise it only once the replacement build is live in the App Store.

> **Going deeper:** [`docs/external-services-guide.md`](../external-services-guide.md) · [`docs/deployment-runbook.md`](../deployment-runbook.md) · [`docs/hearth-data-architecture-overview-v1.md`](../hearth-data-architecture-overview-v1.md) · [`docs/system-map.md`](../system-map.md)
