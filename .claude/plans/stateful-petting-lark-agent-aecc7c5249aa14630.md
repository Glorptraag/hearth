# Hearth LMS: Preview Browser Testability Plan

## Problem Summary

Claude Code's preview browser renders blank pages for all Hearth routes because `ClerkProvider` wraps the entire app in `src/app/layout.tsx`. The headless browser cannot initialize Clerk's frontend JavaScript, so nothing renders — not even the unauthenticated `/dev-preview` routes that use only mock data.

## Key Finding: Route Groups Already Exist

The codebase already uses Next.js route groups: `(auth)` for authenticated pages and `(public)` for onboarding. The dev-preview routes sit outside these groups at `src/app/dev-preview/`, but they still inherit the root layout's `ClerkProvider`. Crucially, **no dev-preview page or shared component imports from `@clerk`** — the only Clerk dependency in the render tree comes from the root layout wrapper.

---

## Phase 1: Isolate Dev-Preview from ClerkProvider (Primary Goal)

**Approach: Conditional ClerkProvider in the root layout.**

The root cause is the client-side `ClerkProvider` React component loading Clerk's JavaScript SDK in the browser. The middleware already marks `/dev-preview(.*)` as public, so server-side auth is not the issue. The fix must prevent `ClerkProvider` from mounting on dev-preview routes.

### Concrete Steps

**Step 1 — Modify `src/middleware.ts`**: Set an `x-pathname` header on every response so the root layout can read the current path.

Add to the middleware handler:
- Create a `NextResponse.next()` response
- Set `response.headers.set('x-pathname', req.nextUrl.pathname)`
- Return the response

The existing public route check and `auth.protect()` call remain unchanged.

**Step 2 — Modify `src/app/layout.tsx`**: Make it an async server component. Read the `x-pathname` header via `next/headers`. Conditionally wrap children in `ClerkProvider` only when NOT on a `/dev-preview` route.

The structure becomes:
- Import `headers` from `next/headers`
- Make `RootLayout` an `async function`
- Read `(await headers()).get('x-pathname')`
- If pathname starts with `/dev-preview`, render `<html><body>{children}</body></html>` without ClerkProvider
- Otherwise, wrap the same markup in `<ClerkProvider>`

**Step 3 — Verify**: Start dev server via launch.json, navigate to `localhost:3000/dev-preview` in preview browser, confirm rendering.

### Risk Assessment

- **Low risk**: The root layout has no `'use client'` directive — it is already a server component. Making it async and reading headers is standard Next.js behavior.
- **ClerkProvider placement**: It still wraps `<html>` for all non-preview routes, matching Clerk's documented pattern.
- **Header fallback**: If `x-pathname` is somehow missing, default to wrapping in ClerkProvider (safe fallback — breaks nothing for production).

---

## Phase 2: Expand Dev-Preview Coverage

### 2a. Missing Pages

The dev-preview covers dashboard, our-story, planner, explore, notifications, settings. Missing:

| Domain | Action | Notes |
|--------|--------|-------|
| Logger | Create `src/app/dev-preview/log/page.tsx` | Currently a placeholder. Reuse log client component with mock data |
| Badges | Create `src/app/dev-preview/badges/` | Mock assessment flow |
| Build | Create `src/app/dev-preview/build/` | Mock module/badge builder |
| Onboarding | Create `src/app/dev-preview/onboarding/` | Mock onboarding wizard |

Follow the established pattern (visible in `src/app/dev-preview/dashboard/page.tsx`):
- Import the real client component from `src/app/(auth)/{domain}/`
- Pass mock data from `mock-data.ts`

### 2b. Expand Mock Data

Add to `src/app/dev-preview/mock-data.ts`:
- `mockBadges` — badge definitions and assessment states
- `mockModuleDrafts` — for build pages
- `mockOnboardingState` — for onboarding flow
- `mockLogDraft` — partial entry for logger testing

### 2c. Update Navigation

Add new routes to:
- `src/app/dev-preview/page.tsx` (the route index ROUTES array)
- `src/app/dev-preview/layout.tsx` (NAV_ITEMS if needed)

---

## Phase 3: API Route Testing with Vitest

### Setup

1. Install: `npm install -D vitest`
2. Create `vitest.config.ts` at project root with path alias resolution matching `tsconfig.json`
3. Create `src/lib/test/mock-auth.ts` — mocks `@clerk/nextjs/server` auth function

### Auth Mocking Pattern

Mock `@clerk/nextjs/server` so `auth()` returns `{ userId: 'test_user_123' }`. This lets route handlers execute without a real Clerk session.

### Database Strategy

Use the existing Neon dev database with a dedicated test family. Wrap tests in transactions that roll back. This avoids adding a second DB driver.

### Test Structure

Place tests alongside routes: `src/app/api/{domain}/__tests__/route.test.ts`

Each test:
1. Mocks `auth()` to return a known userId
2. Seeds test data in `beforeAll`
3. Calls exported `GET`/`POST` functions directly
4. Asserts response status and JSON body
5. Cleans up in `afterAll`

Priority API routes to test first (highest interaction frequency):
- `src/app/api/entries/route.ts` — core logging
- `src/app/api/learners/route.ts` — child management
- `src/app/api/planner/route.ts` — planning
- `src/app/api/notifications/route.ts` — notification center

---

## Phase 4: Clerk Testing Tokens (Skip for Now)

Clerk Testing Tokens bypass server-side auth but do NOT solve the client-side ClerkProvider rendering failure in headless browsers. They would be useful with Playwright but not with Claude Code's preview browser. Defer until real E2E testing is needed.

---

## Implementation Sequence

| Step | Files Modified | Effort | Impact |
|------|---------------|--------|--------|
| 1. Set x-pathname header in middleware | `src/middleware.ts` | 10 min | Prerequisite for step 2 |
| 2. Conditional ClerkProvider | `src/app/layout.tsx` | 15 min | **Unblocks preview browser** |
| 3. Verify in preview browser | No file changes | 5 min | Validation |
| 4. Add missing dev-preview pages | `src/app/dev-preview/{log,badges,build}/` | 1-2 hrs | Broader coverage |
| 5. Expand mock-data.ts | `src/app/dev-preview/mock-data.ts` | 30 min | Data for new pages |
| 6. Install Vitest + config | `package.json`, `vitest.config.ts` | 15 min | API test infrastructure |
| 7. Auth mock helper | `src/lib/test/mock-auth.ts` | 15 min | API test prerequisite |
| 8. API route tests | `src/app/api/*/__tests__/route.test.ts` | 2-3 hrs | API coverage |

**Steps 1-3 are the critical path: ~30 minutes to unblock the preview browser.**

---

## Rejected Alternative

**Route group restructuring**: Moving all routes under a `(clerk)` super-group achieves the same isolation but requires moving multiple directories, updating route groups, and risking broken resolution. The conditional wrapper approach is a 2-file change with identical outcome.
