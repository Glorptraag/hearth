# Co-Facilitator E2E Tests

## Overview

The `e2e/co-facilitator-flow.spec.ts` file contains comprehensive end-to-end tests for the co-facilitator invite and access flow in Hearth. These tests verify the complete lifecycle of adding a co-facilitator to a family account.

## Test Coverage

**File:** `e2e/co-facilitator-flow.spec.ts`
**Total Tests:** 45
**Test Suites:** 10

### Test Suites

#### 1. Co-facilitator invite flow (5 tests)
- Owner can invite with editor role
- Owner can invite with viewer role
- Owner can list all family members including pending invites
- Invited email is recorded correctly
- Tests basic invite creation and token generation

**Endpoints tested:**
- `POST /api/family/members` (invite)
- `GET /api/family/members` (list members)

#### 2. Co-facilitator invite validation (6 tests)
- Cannot invite same email twice
- Invalid token returns 404
- Expired/removed token cannot accept invite
- Role defaults to editor if not specified
- Invalid email format rejected
- Owner cannot invite themselves

**Validation coverage:**
- Email uniqueness constraints
- Token validation
- Schema validation (email format, role enum)
- Default value handling

#### 3. Co-facilitator acceptance flow (4 tests)
- Invited user can accept with valid token
- After accepting, user is marked as active
- Cannot accept same token twice
- Owner cannot accept their own family invitation

**Endpoints tested:**
- `POST /api/family/invite` (accept invitation)
- `GET /api/family/members` (verify status)

#### 4. Co-facilitator dashboard access (7 tests)
- Both owner and editor can access family data
- Both users see same family in member list
- Editor can list entries for the family
- Both users see the same entries
- Can filter entries by date range
- Can filter entries by learner
- Dashboard data consistency

**Endpoints tested:**
- `GET /api/family` (family data)
- `GET /api/family/members` (member list)
- `GET /api/entries` (entry listing with filters)

#### 5. Co-facilitator shared logging (5 tests)
- Owner can create a learning entry
- Editor can create a learning entry
- Entries from both users appear in shared view
- Editor can update their own entry
- Entry contains correct metadata and timestamps

**Endpoints tested:**
- `POST /api/entries` (create entry)
- `GET /api/entries` (list entries)
- `PATCH /api/entries/[id]` (update entry)

#### 6. Co-facilitator removal (4 tests)
- Owner can remove a co-facilitator
- Removed member is marked as removed
- Removed member can be re-invited with new token
- Owner cannot remove themselves

**Endpoints tested:**
- `DELETE /api/family/members` (remove member)
- `POST /api/family/members` (re-invite removed member)

#### 7. Co-facilitator deep-link invite (4 tests)
- Deep-link invite URL can be constructed
- Deep-link join page loads with valid token
- Deep-link join page rejects invalid token
- Token parameter is preserved through auth flow

**Pages tested:**
- `/onboarding/join?token=<token>` (join page)

#### 8. Co-facilitator role-based access (4 tests)
- Role is preserved after acceptance
- Member list shows all roles correctly
- Editor can create entries (role-based)
- Role can be updated during re-invite

**Coverage:**
- Role enum validation (editor, viewer)
- Role persistence across operations

#### 9. Co-facilitator error handling (5 tests)
- Invalid request body returns 400
- Unauthenticated request returns 401
- Non-family-owner cannot invite (403)
- Non-family-owner cannot remove members (403)
- Rate limiting on entry creation (429)

**Error cases covered:**
- Schema validation failures
- Authentication failures
- Authorization failures
- Rate limit enforcement

#### 10. Co-facilitator integration scenarios (2 tests)
- Complete workflow: invite → accept → log → view → remove
- Multiple co-facilitators can log simultaneously
- Invite list is consistent across all members

## Running the Tests

### Prerequisites

1. Hearth dev server running: `npm run dev`
2. Database running (Neon or local Postgres with Docker)
3. Clerk test environment configured
4. All environment variables set in `.env.local`

### Run All Co-Facilitator Tests

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts
```

### Run Specific Test Suite

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts -g "Co-facilitator invite flow"
```

### Run Single Test

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts -g "owner can invite"
```

### Run in Debug Mode

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --debug
```

### Run with UI Mode

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --ui
```

## Test Data Generation

Tests use the `generateTestEmail()` helper function to create unique, isolated test data:

```typescript
function generateTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}
```

This ensures:
- No conflicts between parallel test runs
- Automatic cleanup is not needed (each test uses unique data)
- Test data is human-readable with prefixes (editor-*, viewer-*, etc.)

## API Endpoints Tested

| Endpoint | Method | Purpose | Tests |
|----------|--------|---------|-------|
| `/api/family` | GET | Get family data | dashboard-access |
| `/api/family/members` | GET | List family members | invite-flow, dashboard-access, removal |
| `/api/family/members` | POST | Invite co-facilitator | invite-flow, validation, acceptance, removal |
| `/api/family/members` | DELETE | Remove co-facilitator | removal, error-handling |
| `/api/family/invite` | POST | Accept invitation | acceptance-flow, deep-link, integration |
| `/api/entries` | GET | List family entries | dashboard-access, shared-logging, integration |
| `/api/entries` | POST | Create entry | shared-logging, integration, error-handling |
| `/api/entries/[id]` | PATCH | Update entry | shared-logging |

## Test Isolation and Dependencies

Tests are organized by functionality with `test.beforeEach()` hooks to set up required state:

- **Invite flow tests** create invitations in each test (no shared state)
- **Acceptance tests** invite a user once, then test acceptance
- **Dashboard tests** create an accepted member before running tests
- **Shared logging tests** verify both owner and editor access
- **Removal tests** create and then remove members

Each suite is independent and can run in any order.

## Known Limitations

1. **Authentication Context**: Tests assume authenticated context via Clerk
   - Real integration tests would need to test multi-user scenarios with separate auth sessions
   - Current tests verify API contracts, not full UI flows with authentication

2. **Role-Based Access Control**: Tests verify roles are stored correctly
   - Actual RBAC enforcement (viewer can/cannot perform actions) would need separate auth context per user
   - Current tests verify data consistency

3. **Email Delivery**: Email notifications are not tested
   - Tests verify that invites generate tokens but don't verify email sending
   - Manual testing or separate email service tests are needed

4. **Deep-Link UI Flow**: Tests verify page loads and URL structure
   - Full signup flow after clicking deep-link requires separate authentication tests
   - Current tests verify token is preserved in URL

## Debugging Failed Tests

### Common Issues

**403 Forbidden on invite:**
- Verify authenticated user is the family owner
- Check `families.clerkUserId` matches the current user ID

**404 on family access:**
- Verify family exists for authenticated user
- Check `getFamilyByClerkId()` logic in `lib/auth/helpers.ts`

**409 Conflict on invite:**
- Email is already invited and not removed
- Check email is not already in the family

**401 Unauthorized:**
- Verify Clerk authentication is configured
- Check `auth()` helper is working correctly

### Inspection Tools

Enable trace mode for debugging:

```bash
npx playwright test e2e/co-facilitator-flow.spec.ts --trace on
```

View traces:

```bash
npx playwright show-trace trace.zip
```

## Integration with CI/CD

The `playwright.config.ts` is already configured to run these tests in CI:

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
}
```

### CI Configuration

Add to your GitHub Actions workflow:

```yaml
- name: Run E2E tests
  run: |
    npx playwright install
    npm run dev & # Start dev server
    sleep 10
    npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Extending the Tests

### Adding New Test Cases

1. **Add to existing suite** if testing similar functionality
2. **Create new suite** if testing a new feature area
3. **Use same patterns** for consistency:
   - Helper function for unique test data
   - `test.beforeEach()` for setup
   - Clear assertion messages
   - Cleanup in tests (not afterEach)

### Example: New Test

```typescript
test('description of what is being tested', async ({ request }) => {
  // Setup
  const testEmail = generateTestEmail('prefix');

  // Action
  const response = await request.post(`${BASE_URL}/api/endpoint`, {
    data: { /* ... */ },
  });

  // Assert
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.field).toBe('expected-value');
});
```

## Performance Considerations

Current tests:
- Use parallel execution (Playwright default)
- Create minimal test data (unique emails only)
- No artificial delays or sleeps
- Fast API calls (no UI rendering overhead)

**Expected runtime**: 3-5 minutes for full suite on typical hardware

## Maintenance

### Regular Updates

- **Update endpoints** if API contracts change
- **Update validation** if schema changes
- **Update roles** if new roles are added
- **Update statuses** if member status values change

### Schema Changes

If the `familyMembers` or related tables change:

1. Update tests for new fields
2. Add tests for new validation rules
3. Update error handling tests if new errors are possible
4. Add new role/status values if added to schema

## References

- **API Implementation:** `src/app/api/family/members/route.ts`, `src/app/api/family/invite/route.ts`
- **Database Schema:** `src/lib/db/schema.ts` (familyMembers, families tables)
- **Auth Helper:** `src/lib/auth/helpers.ts` (getFamilyByClerkId, getFamilyRole)
- **Playwright Config:** `playwright.config.ts`
