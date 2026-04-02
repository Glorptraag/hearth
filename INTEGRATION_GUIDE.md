# Co-Facilitator E2E Tests - Integration Guide

## What You've Received

A comprehensive E2E test suite for the co-facilitator invite and access flow:

```
e2e/co-facilitator-flow.spec.ts      (990 lines, 45 tests, 10 suites)
e2e/README.md                         (Quick reference)
docs/e2e-co-facilitator-tests.md     (Detailed documentation)
```

## Quick Start (2 minutes)

### 1. Ensure Prerequisites

```bash
# Terminal 1: Start the dev server
npm run dev

# Wait for "ready - started server on 0.0.0.0:3000"
```

### 2. Run Tests

```bash
# Terminal 2: Run the co-facilitator tests
npx playwright test e2e/co-facilitator-flow.spec.ts
```

### 3. Check Results

Should see output like:
```
45 passed
```

## What Gets Tested

### Invite Flow
- Owner can invite with editor/viewer role
- Emails are unique
- Tokens are generated correctly

### Validation
- Invalid tokens rejected
- Invalid emails rejected
- Cannot invite same email twice
- Role defaults to editor

### Acceptance
- User can accept invite with token
- Status changes to active
- Cannot accept same token twice

### Access Control
- Both owner and editor access family data
- Both can view shared entries
- Both can create entries

### Shared Logging
- Owner creates entries visible to editor
- Editor creates entries visible to owner
- Entries can be updated
- Metadata is preserved

### Member Removal
- Owner can remove co-facilitator
- Removed member cannot accept old tokens
- Removed member can be re-invited

### Deep-Link Invites
- Token in URL is preserved
- Page loads and validates token

### Error Handling
- Invalid requests return 400
- Unauthenticated return 401
- Unauthorized return 403
- Rate limiting returns 429

### Integration Scenarios
- Complete workflow: invite → accept → log → view → remove
- Multiple co-facilitators working simultaneously
- Data consistency across operations

## File Structure

```
e2e/
├── co-facilitator-flow.spec.ts    ← NEW: Main test file
├── critical-flows.spec.ts         ← Existing: Basic flow tests
└── README.md                       ← NEW: Quick reference

docs/
└── e2e-co-facilitator-tests.md    ← NEW: Detailed guide

playwright.config.ts               ← Existing: Already configured
```

## Test Dependencies

The tests are independent and require:

1. **Dev Server Running**
   - `npm run dev` must be running
   - Responds on `http://localhost:3000` (configurable)

2. **Database**
   - Neon or local Postgres
   - Must have `families` and `familyMembers` tables
   - Schema from `src/lib/db/schema.ts`

3. **Authentication**
   - Clerk configured and working
   - Tests assume authenticated context
   - Uses `@clerk/nextjs` for API auth

4. **API Endpoints**
   - All endpoints in `src/app/api/family/*` must be working
   - Entry endpoints at `src/app/api/entries/*`

## Implementation Notes

### Test Data Generation

Tests use unique email generation to avoid conflicts:

```typescript
function generateTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}
```

Each test gets unique data:
- `editor-1712345678-abc123def@test.local`
- `viewer-1712345679-xyz987uvw@test.local`

No cleanup needed between runs.

### Test Isolation

Each test suite has `test.beforeEach()` hooks that:
- Create fresh test data
- Set up required state
- Ensure no test pollution

### API Testing Pattern

Tests use Playwright's `request` fixture:

```typescript
const response = await request.post(`${BASE_URL}/api/family/members`, {
  data: {
    email: 'test@example.com',
    role: 'editor',
  },
});

expect(response.status()).toBe(200);
const data = await response.json();
expect(data.token).toBeTruthy();
```

## Common Issues & Solutions

### Tests Fail with 401 Unauthorized

**Problem:** Not authenticated in test context

**Solution:** Ensure Clerk is configured:
```bash
# .env.local must have:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Tests Timeout

**Problem:** Dev server slow or not running

**Solution:**
```bash
# Terminal 1
npm run dev
sleep 10  # Wait for startup

# Terminal 2
npx playwright test e2e/co-facilitator-flow.spec.ts
```

### 404 Family Not Found

**Problem:** No family for authenticated user

**Solution:** Test assumes family exists for user. Check:
- Family creation in onboarding flow
- `getFamilyByClerkId()` in `src/lib/auth/helpers.ts`

### 409 Conflict on Invite

**Problem:** Email already invited

**Solution:** Each test uses unique email. If you see this:
- Run with fresh database, or
- Tests are not actually isolated (check `beforeEach`)

## Running Subset of Tests

```bash
# Just invite tests
npx playwright test -g "Co-facilitator invite flow"

# Just removal tests
npx playwright test -g "Co-facilitator removal"

# Just error handling
npx playwright test -g "error handling"

# Single test by exact name
npx playwright test -g "owner can invite a co-facilitator"
```

## Debugging

### Enable Trace

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --trace on
npx playwright show-trace trace.zip
```

### Debug Mode

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --debug
```

Opens Playwright inspector with step-by-step execution.

### UI Mode (Visual)

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --ui
```

Interactive test runner with visual browser.

### Verbose Output

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --verbose
```

## Integration with CI/CD

The tests follow the existing Playwright config in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
});
```

Add to GitHub Actions:

```yaml
- name: Run E2E tests
  run: |
    npm run dev &
    sleep 10
    npx playwright test e2e/co-facilitator-flow.spec.ts

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Next Steps

1. **Run tests locally** to ensure they pass
2. **Add to CI/CD** pipeline if using GitHub Actions
3. **Review documentation** at `docs/e2e-co-facilitator-tests.md`
4. **Extend tests** if adding new co-facilitator features

## Documentation

- **Quick Ref:** `e2e/README.md` (running tests)
- **Detailed:** `docs/e2e-co-facilitator-tests.md` (architecture, endpoints, debugging)

## Questions?

The test file itself is thoroughly commented:
- Each test has a descriptive name
- Comments explain setup and assertions
- Edge cases are documented

Review `docs/e2e-co-facilitator-tests.md` for architecture details and API endpoint mapping.

## Summary

✓ 45 comprehensive tests
✓ 10 test suites covering all flows
✓ 8 API endpoints tested
✓ Error handling and validation
✓ Integration scenarios
✓ Ready to integrate and extend

Tests follow your existing Playwright patterns and can be run alongside `critical-flows.spec.ts`.
