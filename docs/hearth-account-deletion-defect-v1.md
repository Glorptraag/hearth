<!-- Version: 2 | Date: 2026-10-20 | Changes: RESOLVED under decision D1 (transfer ownership). Added §0 resolution; §1–§5 kept as the original defect record. -->
<!-- Version: 1 | Date: 2026-08-05 | Changes: Initial creation. Verified defect report — account deletion 500s for most real families; three separate data-deletion gaps. -->

# Account deletion is broken — defect report v1

> **Status:** RESOLVED 2026-10-20 (pivot task T6.1). Decision D1 (Drew, 2026-10-19): **transfer ownership**.
> **Severity (was):** High. Live user-facing bug, a privacy obligation, and a blocker for both app stores.
> **Pinned by:** `src/app/api/account/delete/orphan-tables.integration.test.ts` (now a passing `it`, schema-derived),
> `transfer.integration.test.ts`, `route.integration.test.ts`.
> **Found during:** native-pivot Phase 4 store-compliance prep (`hearth-native-app-plan-v1.md`).

---

## 0. Resolution (2026-10-20)

Logic lives in `src/lib/account/delete.ts` (`deleteAccount`); the route
(`src/app/api/account/delete/route.ts`) only does auth, rate limit and the
confirmation phrase. The response is `{ deleted: true, outcome }`.

**Three outcomes**, by the caller's place in the family model
(`families.clerk_user_id` = owner; `family_members` = co-facilitators):

| Caller | Outcome | What happens |
|---|---|---|
| Co-facilitator (active `family_members` row) | `member_removed` | Their membership rows, Logger draft and push tokens go, then their Clerk user. The family is untouched. *(Previously 403.)* |
| Owner, with an eligible adult member | `ownership_transferred` | `families.clerk_user_id` moves to the successor (whose member row is removed — owners are modelled on `families`, not as a member row). Owner's personal rows + Clerk user deleted. Family data and blobs stay. |
| Owner, sole adult | `family_deleted` | Every row referencing the family is deleted or detached, community Hearths handed over or deleted, every evidence blob deleted, Clerk user deleted. |

**Successor rule (D1 — not specified further by Drew, chosen here):** highest role first, then longest-standing.

- *Family:* `owner` > `editor` > `viewer`, then earliest `coalesce(joined_at, invited_at, created_at)`.
  Eligible only if `status = 'active'`, has a Clerk identity, and doesn't already own a family of their own
  (`families.clerk_user_id` is unique). Invited-but-never-joined members are not eligible.
- *Community Hearth* (`hearths.created_by_family_id`, NOT NULL): `coordinator` > `member`, then earliest
  `joined_at`, among `active` member families. The successor is made `coordinator`. A Hearth with no
  other active member family is deleted with its sessions, attendance, evidence, observations,
  reflections, invites and memberships (members who had `left` included).

**Footprint in Hearths that live on:** sessions the family facilitated are kept and reassigned to the
Hearth's (post-handover) owner with `facilitator_user_id` nulled — other families attended and reflected
on them. The family's own attendance, uploads, reflections, suggested observations (as observer or
target), memberships and outgoing invites are deleted; `hearth_invites.used_by_family_id` and
`hearth_memberships.invited_by_family_id` are nulled.

**Admin records** (`invitations`, `provider_codes`) survive with `redeemed_by_family_id` nulled.

**Atomicity.** All DB writes for one deletion are one transaction: neon-http `db.batch` in production
(Neon runs a batch atomically — the driver has no interactive transactions), `db.transaction` on drivers
without `batch`. Deletes use subqueries rather than pre-read id lists, so a row added between planning and
commit is still caught (or the batch fails whole and nothing is deleted). Tests: a blocker FK added
mid-test makes the final `DELETE FROM families` fail → every earlier statement rolled back, Clerk/Blob
untouched.

**After the commit** (never rolled back; failures `console.error` + Sentry `step` tag):
1. Blob: refs collected **before** the commit — `learning_entry_evidence` photo/audio content,
   legacy `learning_entries.evidence_urls`, `session_evidence.file_url` for the family's uploads and for
   deleted Hearths — plus a `list({ prefix: 'evidence/<familyId>/' })` sweep that catches uploads never
   saved to a row. Only blob refs are deleted (`evidence/…`, `hearth-evidence/…` pathnames or
   `*.blob.vercel-storage.com` URLs), never a link a parent pasted. `del()` in chunks of 100.
2. Clerk: `clerkClient().users.deleteUser(userId)`.

**Coverage guard.** `orphan-tables.integration.test.ts` reads every FK into `families` from
`pg_constraint`, asserts the seed populates **all** of them (35 columns today), then asserts zero rows
reference the family, its learners or its entries afterwards. A new table referencing `families` fails
the test until it is seeded and handled.

### Follow-ups (outside T6.1's files)

- **Copy is now stale:** `SettingsClient.tsx` delete panel and `/privacy` + `/terms` say deletion removes
  every family row and that Clerk must be deleted separately. Both need rewording for the three outcomes.
- The UI doesn't yet tell an owner *who* will inherit the family before they confirm.
- `ON DELETE CASCADE` migration on the family FKs still worth considering; the catalog-driven test makes it
  optional rather than urgent.
- Opaque Clerk ids remain in text columns of surviving community/feedback rows
  (`session_evidence.uploaded_by_user_id`, `suggested_observations.observer_user_id`,
  `session_reflections.user_id`, `custom_threads.created_by_user_id` on a transferred family). They no longer
  resolve to a person once the Clerk user is gone.

---

## 1. What is wrong

`POST /api/account/delete` **returns 500 for most real families.** They cannot delete their account at all.

Every foreign key into `families(id)` is declared `ON DELETE no action` — 27 of them:

```bash
grep -rho 'REFERENCES "public"."families"("id")[^;]*' drizzle/*.sql | sort | uniq -c
#   27 REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action
```

The route deletes 13 tables then runs `DELETE FROM families`. Any row it missed makes that final statement raise a foreign-key violation, and the whole request fails.

**Verified runtime failure** (real Postgres, transaction-isolated integration harness):

```
AssertionError: expected 500 to be 200
cause: error: update or delete on table "learners" violates foreign key constraint
       "heu_reports_learner_id_learners_id_fk" on table "compliance_reports"
```

A family hits this if it has *ever*: been invited (`invitations`), run a module (`module_runs`),
bought a pack (`entitlements`), generated a report (`compliance_reports`), created a custom
thread, earned a family-authored badge, or joined a Hearth. That is close to every real pilot family.

### Why the existing test didn't catch it

`route.integration.test.ts` seeds only the tables the route already deletes, so its
"cascade-deletes every family-scoped row" case passes while proving nothing about the rest of
the schema. It was written against the implementation rather than against the schema.

---

## 2. Three distinct gaps

**(a) Twelve family-scoped tables are never deleted.** Not in the route, and no cascade:

| Table | Notes |
|---|---|
| `compliance_reports` | **confirmed 500 source**; reports about children |
| `work_samples` | → `compliance_reports`, `learning_entries` |
| `work_sample_annotations` | annotations about a child's work |
| `entitlements` | purchase grants |
| `module_runs` | |
| `family_pack_state` | |
| `family_library_state` | |
| `custom_threads` | |
| `badge_definitions` | family-authored badges |
| `invitations` | `redeemed_by_family_id` back-reference |
| `logger_drafts` | draft entry text about children |
| `hearth_sessions` + `session_attendance` / `session_evidence` / `session_reflections` | community data |

Reachable by cascade and therefore fine: `learning_entry_evidence`, `feedback`,
`learner_dlo_status`, `observation_dlo_links`.

**(b) The Clerk user is never deleted.** The route comments that the client handles it —
`SettingsClient.tsx` does not. It only calls `/api/account/delete`. So email, name and auth
identity survive "deletion". Apple 5.1.1(v) requires deleting the account, not deactivating it.

**(c) Evidence photos are never deleted from Blob storage.** `@vercel/blob`'s `put` is used in
the upload routes; **`del` appears nowhere in the codebase.** Deleting `learning_entries`
cascades the `learning_entry_evidence` rows, which are the only record of the blob pathnames —
so the blobs are orphaned beyond reach. These are **private photographs of children**. This is
the most serious of the three.

---

## 3. Product decision required before fixing — DECIDED: option 2 (D1, 2026-10-19), see §0

`hearths.created_by_family_id` is `NOT NULL` and references `families(id)`. If a deleting family
created a Hearth, you cannot null it, so the fix must choose:

1. **Delete the Hearth** — destroys a shared community space and other families' sessions and reflections in it.
2. **Transfer ownership** to another member, delete only if it's the last member.
3. **Block deletion** while the family owns an active Hearth, with a clear message.

(2) is most defensible but is the most work. **This is Drew's call — do not pick it silently.**

---

## 4. Acceptance criteria

Flip `it.fails` → `it` in the pinned test, and add:

- [x] Deletion returns 200 for a family holding rows in every table in §2(a).
- [x] No row referencing that `familyId` survives in any table — assert per table, not a spot check.
- [x] `invitations.redeemed_by_family_id` no longer points at the deleted family.
- [x] The Clerk user is deleted (`clerkClient.users.deleteUser`) — mocked in tests, real in prod.
- [x] Every evidence blob for the family is deleted via `del()`; collect pathnames **before** deleting the rows that hold them.
- [x] A case covering the §3 Hearth decision, whichever way it goes.
- [x] Deletion runs in a **transaction** so a partial failure cannot leave a half-deleted family.

Consider adding `ON DELETE CASCADE` to the family FKs in a migration — it would make this class
of bug structurally impossible rather than a checklist. Blob and Clerk cleanup still need explicit code.

---

## 5. Reproduce

```bash
docker compose -f docker-compose.test.yml up -d --wait
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hearth_test
npm run db:migrate
TZ=UTC npx vitest run --config vitest.integration.config.ts src/app/api/account/delete/
```

Now reports all tests passing (`npm run test:integration:local` runs the same suite end to end).
