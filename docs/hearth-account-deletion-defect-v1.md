<!-- Version: 1 | Date: 2026-08-05 | Changes: Initial creation. Verified defect report — account deletion 500s for most real families; three separate data-deletion gaps. -->

# Account deletion is broken — defect report v1

> **Status:** OPEN. Verified against real Postgres 2026-08-05. **Not fixed.**
> **Severity:** High. Live user-facing bug, a privacy obligation, and a blocker for both app stores.
> **Pinned by:** `src/app/api/account/delete/orphan-tables.integration.test.ts` (`it.fails`).
> **Found during:** native-pivot Phase 4 store-compliance prep (`hearth-native-app-plan-v1.md`).

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

## 3. Product decision required before fixing

`hearths.created_by_family_id` is `NOT NULL` and references `families(id)`. If a deleting family
created a Hearth, you cannot null it, so the fix must choose:

1. **Delete the Hearth** — destroys a shared community space and other families' sessions and reflections in it.
2. **Transfer ownership** to another member, delete only if it's the last member.
3. **Block deletion** while the family owns an active Hearth, with a clear message.

(2) is most defensible but is the most work. **This is Drew's call — do not pick it silently.**

---

## 4. Acceptance criteria

Flip `it.fails` → `it` in the pinned test, and add:

- [ ] Deletion returns 200 for a family holding rows in every table in §2(a).
- [ ] No row referencing that `familyId` survives in any table — assert per table, not a spot check.
- [ ] `invitations.redeemed_by_family_id` no longer points at the deleted family.
- [ ] The Clerk user is deleted (`clerkClient.users.deleteUser`) — mocked in tests, real in prod.
- [ ] Every evidence blob for the family is deleted via `del()`; collect pathnames **before** deleting the rows that hold them.
- [ ] A case covering the §3 Hearth decision, whichever way it goes.
- [ ] Deletion runs in a **transaction** so a partial failure cannot leave a half-deleted family.

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

Currently reports `1 expected fail`. Once fixed it will report a real failure until the test is flipped.
