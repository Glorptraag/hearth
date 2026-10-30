<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 07 — Families, accounts and access

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

In Hearth the account is the **family**, not the person. One person signs up and becomes the family's **owner**. They add their children and can invite other adults (a partner, a grandparent, a tutor) as **co-facilitators** with a role that sets what they can do. Sign-in is handled by **Clerk**. Everything else (children, settings, entries) lives in the Postgres database, tied to the family. During the pilot, new families join with an **invitation code**. Families can export their data at any time. **Account deletion is currently broken for most real families**: this is a known, documented, high-severity defect awaiting a product decision.

## How it works

### Sign-in and identity

- **Clerk** owns the login itself: email, password or social sign-in, sessions, and the sign-in screens (themed to match Hearth's light and dark modes).
- Hearth links each Clerk user to a family (`families.clerk_user_id` for the owner, `family_members` for co-facilitators).
- Every API call first asks Clerk "who is this?", then looks up their family and role. A request without a signed-in user gets **401**; a request from a user without a family gets **404**.
- **The iOS app** signs in natively with Clerk's iOS SDK and sends its session token as `Authorization: Bearer` on every API call, so the same routes serve both apps. Web pages the app shows inside itself (reports, constellation, builders) have their own cookie session. When one of them lands on the sign-in page, the app asks `POST /api/native/web-session` (bearer only) for a single-use Clerk sign-in ticket that expires after 60 seconds, and loads `/native/handoff`, which redeems it and continues to the page. The page to continue to is only accepted as a Hearth path, so the handoff can't redirect anywhere else. Plan: [`docs/hearth-native-ios-plan-v2.md`](../hearth-native-ios-plan-v2.md) §4.

### Roles

| Role | Can view | Can log and edit | Can manage members, settings and account |
|---|---|---|---|
| **Owner** | ✓ | ✓ | ✓ |
| **Editor** | ✓ | ✓ | — |
| **Viewer** | ✓ | — | — |

Two checks enforce this on the server: `checkWritePermission()` (owner or editor) on every write, and `checkOwnerPermission()` (owner only) on member, settings and account actions. Both are in `src/lib/auth/helpers.ts`. A forbidden action returns **403**. Hiding a button is never the only protection.

**Admins** are a separate thing: a short list of Clerk user IDs in the `ADMIN_CLERK_IDS` environment variable (`src/lib/auth/admin.ts`). Admins can open `/admin` (analytics, AI cost, content QA, invitations, audit log, families). Admin actions are recorded in `admin_audit_log`.

### Two kinds of invitation

| | **Pilot invitation code** | **Co-facilitator invite** |
|---|---|---|
| Purpose | Lets a new family join the pilot | Adds another adult to an existing family |
| Created by | An admin, in `/admin` | The family owner, in Settings |
| Stored in | `invitations` | `family_members` (status `invited`, with a one-time token) |
| Redeemed via | `/api/invitations/validate` → `/api/invitations/redeem` | `/api/family/invite` (token accept) |
| Expiry | 30 days by default. A daily job at 20:00 UTC expires old codes | None. Valid until accepted, or until the owner removes the pending member |

### Onboarding and settings

New families go through onboarding (`src/app/(public)/onboarding`): add children, choose the **state/territory**, and run the **pedagogy wizard**. Their settings (`family_settings`) cover:

- **State/territory.** This drives report shape and coverage. If it's left blank, coverage falls back (see [05](./05-reporting-and-portfolio.md)).
- **Pedagogy preference** (see [06](./06-content-modules-and-planning.md#the-pedagogy-layer)).
- **HEU registration details.** Provider codes are validated against `provider_codes`.
- **Notification preferences.**
- **Logger default mode** (guided or quick).

Changing settings triggers a snapshot rebuild so screens pick up the change.

### Child identity colours

Each child gets an identity colour used across every screen. It comes from one central map (`LEARNER_COLOUR_MAP` in `src/components/ui/LearnerAvatar.tsx`).

### Data export

The owner can download the family's data from Settings (`/api/account/export`). This is covered by an integration test.

### Account deletion: **known defect**

> **Status: OPEN, high severity, not fixed.** Full report: [`docs/hearth-account-deletion-defect-v1.md`](../hearth-account-deletion-defect-v1.md).

What's wrong, in plain terms:

1. **Deletion fails for most real families.** The delete routine clears 13 kinds of family data, but the database has 27 links back to the family record, all set to *block* deletion while related data still exists. So if a family has **ever** been invited, run a module, bought a pack, generated a report, created a custom thread, earned a family-authored badge or joined a hearth (nearly every pilot family), the final step fails and the parent sees an error.
2. **The sign-in account survives.** Even a successful deletion doesn't delete the user in Clerk, so their email and name remain. This conflicts with App Store rules.
3. **Photos survive.** Evidence photos in Vercel Blob are never deleted. Worse, the database rows that point to them *are* deleted, leaving private photos of children stored with nothing referencing them.

Why it isn't fixed yet: the fix needs a **product decision from Drew** about what happens to a community hearth when the family that created it leaves. The defect is pinned in automated tests with a deliberately "expected to fail" test (`orphan-tables.integration.test.ts`). The moment someone fixes it, that test breaks loudly, prompting it to be switched to a normal passing test.

**What support should do today when a family asks to delete their account:** don't direct them to the in-app button and expect it to work. Acknowledge the request, record it, and escalate it to Drew for a manual deletion covering the database rows, the Clerk user and the Blob files. Treat it as a privacy obligation with a clock on it.

## Where it lives

| Thing | Location |
|---|---|
| Auth helpers and roles | `src/lib/auth/helpers.ts`, `src/lib/auth/admin.ts` |
| Clerk theming | `src/app/clerk-theme.ts`, `src/components/ClerkThemeProvider.tsx` |
| iOS app → web sign-in handoff | `src/lib/platform/handoff.ts`, `/api/native/web-session`, `src/app/native/handoff/` |
| Family, members, invites | `/api/family`, `/api/family/members`, `/api/family/invite`, `/api/invitations/*` |
| Settings | `/api/settings`, `src/app/(auth)/settings/` |
| Export and delete | `/api/account/export`, `/api/account/delete` |
| Tables | `families`, `family_members`, `family_settings`, `learners`, `invitations`, `provider_codes`, `admin_audit_log` |

## What can go wrong

| Symptom | Likely cause | What to do |
|---|---|---|
| "My partner can see but can't log" | They were invited as a **viewer** | Roles can't be edited in place (`/api/family/members` only adds and removes). The owner removes them and re-invites them as an editor |
| "Insufficient permissions" error (403) | A viewer, or a non-owner trying an owner-only action | Check the role on `family_members` |
| "Invalid or expired invitation" | Co-facilitator link already used or revoked; pilot code past its 30 days | Issue a new invite or code |
| "Family not found" after sign-in | A Clerk user exists but isn't linked to a family (onboarding not finished, or an invite never accepted) | Have them finish onboarding or accept the invite |
| In the iOS app, a web page keeps asking them to sign in | The handoff ticket failed (expired, already used, or the route rate-limited the app at 10 a minute) | They can sign in once on that page and it sticks. Check Sentry for `POST /api/native/web-session`; errors carry the app build in the `client` tag |
| "I can't delete my account" | **Known defect** (above) | Escalate for manual deletion. Don't ask them to retry |
| Report shows the wrong state's wording | State not set, or set to the wrong state | Fix the state in Settings |

## Status and known gaps

- **Working:** family accounts with three roles enforced on the server, both invite systems, onboarding, settings, admin access with an audit log, data export.
- **Broken:** account deletion (above). It's a blocker for the app-store submission and for full privacy compliance.
- **Planned:** native push notifications. A `device_tokens` table and registration endpoint exist (`/api/device-tokens`); delivery is part of the native plan.

> **Going deeper:** [`docs/hearth-account-deletion-defect-v1.md`](../hearth-account-deletion-defect-v1.md) · [`docs/hearth-family-settings-spec-v1.md`](../hearth-family-settings-spec-v1.md) · [`docs/e2e-co-facilitator-tests.md`](../e2e-co-facilitator-tests.md) · [`docs/test-family-onboarding-packet.md`](../test-family-onboarding-packet.md)
