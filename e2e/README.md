# Hearth E2E Tests

End-to-end tests for Hearth using Playwright.

## Quick Start

### 1. Ensure Server is Running

```bash
npm run dev
```

### 2. Run All E2E Tests

```bash
npx playwright test
```

### 3. Run Specific Test File

```bash
npx playwright test critical-flows.spec.ts
npx playwright test co-facilitator-flow.spec.ts
```

### 4. Run Specific Test Suite

```bash
npx playwright test -g "Co-facilitator invite flow"
```

### 5. Run in UI Mode (Visual)

```bash
npx playwright test --ui
```

### 6. Run in Debug Mode

```bash
npx playwright test --debug
```

## Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `critical-flows.spec.ts` | Basic app functionality (landing, auth, routes) | 14 |
| `co-facilitator-flow.spec.ts` | Co-facilitator invite & access lifecycle | 45 |

## Configuration

- **Base URL:** `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browser:** Chromium only (see `playwright.config.ts`)
- **Parallelization:** Enabled (run multiple tests simultaneously)
- **Retries:** 0 in dev, 2 in CI

## Troubleshooting

### Tests fail with 401 Unauthorized

**Cause:** Not authenticated in test context
**Solution:** Ensure Clerk test credentials are in your `.env.local`

### Tests fail with 404 Family Not Found

**Cause:** Family doesn't exist for authenticated user
**Solution:** Create a test family first or ensure user is properly authenticated

### Tests fail with timeout

**Cause:** Dev server not running or slow to respond
**Solution:**
```bash
npm run dev  # Start server in another terminal
sleep 5     # Wait for startup
npx playwright test
```

### Port conflict

If port 3000 is in use:
```bash
BASE_URL=http://localhost:3001 npx playwright test
```

## Environment

Tests expect these environment variables:

```bash
# .env.local
BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://...  # Neon or local Postgres
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

## Output

Test results are printed to console by default. For HTML report:

```bash
npx playwright test
npx playwright show-trace trace.zip  # View trace from first failure
```

Reports are in `playwright-report/` directory.

## More Information

See `docs/e2e-co-facilitator-tests.md` for detailed test documentation.
