/**
 * UNIT TEST SETUP
 *
 * Registers global mocks for every external dependency. Runs once per
 * test file before any `describe` blocks.
 *
 * Philosophy: default to a working signed-in state. 80% of tests want a
 * happy-path user. The other 20% override with helpers from clerk-helpers.ts.
 *
 * CRITICAL: Clerk v7 makes `auth()` and `clerkClient()` async. All mocks
 * that stand in for them return promises. Use `mockResolvedValue()` to
 * override, never `mockReturnValue()`.
 */
import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// ---------------------------------------------------------------------------
// Sanity client config — `@/lib/sanity/client` throws a ConfigError if these
// are unset (before it ever reaches the mocked @sanity/client below), which
// would make any route that touches Sanity hard-fail in tests. Provide dummy
// values so the *mocked* client constructs and returns its canned [] data.
// `??=` so a real env (local .env) still wins.
// ---------------------------------------------------------------------------
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test';

// Fixed 32-byte key so facilitator-note encryption (src/lib/crypto/field-encryption.ts)
// round-trips in tests. `??=` so a real env still wins. Not a real secret.
process.env.FACILITATOR_NOTES_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString('base64');

// ---------------------------------------------------------------------------
// Test identity constants — exported so tests and factories use the same IDs
// ---------------------------------------------------------------------------
export const TEST_USER_ID = 'user_test_default';
// uuid-typed columns reject non-uuid strings; keep this as a real uuid so
// integration tests that use TEST_FAMILY_ID as families.id work as-is.
export const TEST_FAMILY_ID = '00000000-0000-0000-0000-00000000000a';
export const TEST_ORG_ID = 'org_test_default';

const defaultUser = {
  id: TEST_USER_ID,
  firstName: 'Test',
  lastName: 'Parent',
  fullName: 'Test Parent',
  primaryEmailAddressId: 'email_test_1',
  emailAddresses: [{ id: 'email_test_1', emailAddress: 'parent@example.com' }],
  publicMetadata: { familyId: TEST_FAMILY_ID, role: 'owner' as const },
  privateMetadata: {},
  unsafeMetadata: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const defaultAuth = {
  userId: TEST_USER_ID,
  sessionId: 'sess_test_1',
  orgId: TEST_ORG_ID,
  orgRole: 'org:owner',
  orgSlug: 'test-family',
  isAuthenticated: true,
  has: vi.fn(() => true),
  getToken: vi.fn(async () => 'test_token'),
  redirectToSignIn: vi.fn(),
  protect: vi.fn(),
  sessionClaims: { sub: TEST_USER_ID },
};

// ---------------------------------------------------------------------------
// @clerk/nextjs/server — server helpers. v7 is ASYNC.
// ---------------------------------------------------------------------------
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => defaultAuth),
  currentUser: vi.fn(async () => defaultUser),
  clerkClient: vi.fn(async () => ({
    users: {
      getUser: vi.fn(async () => defaultUser),
      getUserList: vi.fn(async () => ({ data: [defaultUser], totalCount: 1 })),
      updateUserMetadata: vi.fn(async () => defaultUser),
    },
    organizations: {
      getOrganization: vi.fn(async () => ({
        id: TEST_ORG_ID,
        name: 'Test Family',
        slug: 'test-family',
      })),
      getOrganizationMembershipList: vi.fn(async () => ({ data: [], totalCount: 0 })),
    },
    sessions: {
      getSession: vi.fn(async () => ({ id: 'sess_test_1', userId: TEST_USER_ID })),
    },
  })),
  getAuth: vi.fn(() => defaultAuth),
  clerkMiddleware: vi.fn((handler) => handler),
  createRouteMatcher: vi.fn(() => () => false),
}));

// ---------------------------------------------------------------------------
// @clerk/nextjs — client components and hooks
// ---------------------------------------------------------------------------
vi.mock('@clerk/nextjs', () => {
  const PassThrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    ClerkProvider: PassThrough,
    SignedIn: PassThrough,
    SignedOut: () => null,
    SignIn: PassThrough,
    SignUp: PassThrough,
    UserButton: () => null,
    OrganizationSwitcher: () => null,
    useAuth: vi.fn(() => ({
      isLoaded: true,
      isSignedIn: true,
      userId: TEST_USER_ID,
      sessionId: 'sess_test_1',
      orgId: TEST_ORG_ID,
      orgRole: 'org:owner',
      signOut: vi.fn(async () => {}),
      getToken: vi.fn(async () => 'test_token'),
    })),
    useUser: vi.fn(() => ({ isLoaded: true, isSignedIn: true, user: defaultUser })),
    useOrganization: vi.fn(() => ({
      isLoaded: true,
      organization: { id: TEST_ORG_ID, name: 'Test Family', slug: 'test-family' },
      membership: { role: 'org:owner' },
    })),
    useSession: vi.fn(() => ({
      isLoaded: true,
      isSignedIn: true,
      session: { id: 'sess_test_1' },
    })),
  };
});

// ---------------------------------------------------------------------------
// next/server — partial mock so route tests can call `after()`.
//
// In real Next.js, `after()` only works inside a request scope. Vitest
// imports the route handler directly and invokes POST(req) outside that
// scope, so the real `after()` throws `NEXT_DYNAMIC_API_WRONG_CONTEXT`.
//
// We run the callback as a microtask AND record its promise on a globalThis
// registry. The INTEGRATION harness (vitest.integration.setup.ts) flushes that
// registry *inside* each test's transaction before rollback, so a route's
// post-response DB write (enrichment, draft-resume notification, snapshot
// rebuild) can't escape onto the shared pinned connection and abort a LATER
// test — the cascade that turned the whole suite red. Unit tests ignore the
// registry (everything's mocked; nothing to flush). globalThis (not a module
// export) so the hoisted vi.mock factory can reference it without the
// "cannot export hoisted variable" trap.
// ---------------------------------------------------------------------------
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    after: vi.fn((callback: () => void | Promise<void>) => {
      const g = globalThis as typeof globalThis & { __hearthAfter?: Promise<unknown>[] };
      (g.__hearthAfter ??= []).push(
        Promise.resolve().then(callback).catch(() => { /* swallow — tracked only for test isolation */ }),
      );
    }),
  };
});

// ---------------------------------------------------------------------------
// next/headers — some Clerk internals read these
// ---------------------------------------------------------------------------
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => ({ name, value: `test_${name}` })),
    getAll: vi.fn(() => []),
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => new Map()),
  draftMode: vi.fn(async () => ({ isEnabled: false, enable: vi.fn(), disable: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// next/navigation — redirect() throws in real Next; mock mirrors that
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// ---------------------------------------------------------------------------
// @anthropic-ai/sdk — never spend tokens in unit tests
// ---------------------------------------------------------------------------
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn(() => ({
    messages: {
      create: vi.fn(async () => ({
        id: 'msg_test_1',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{"subjects":["science"],"capabilityThreads":["scientific-thinking"]}' }],
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      })),
    },
  }));
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

// ---------------------------------------------------------------------------
// Sanity client — content fetches return empty arrays by default.
// Override in individual tests with fixture data via vi.mocked(client.fetch).
// ---------------------------------------------------------------------------
vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({
    fetch: vi.fn(async () => []),
    create: vi.fn(async (doc: unknown) => doc),
    patch: vi.fn(() => ({ set: vi.fn(() => ({ commit: vi.fn(async () => ({})) })) })),
    delete: vi.fn(async () => ({})),
  })),
}));

// ---------------------------------------------------------------------------
// @vercel/blob — evidence uploads return fake URLs in tests
// ---------------------------------------------------------------------------
vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (filename: string) => ({
    url: `https://test-blob.local/${filename}`,
    downloadUrl: `https://test-blob.local/${filename}`,
    pathname: filename,
    contentType: 'application/octet-stream',
    contentDisposition: `inline; filename="${filename}"`,
  })),
  del: vi.fn(async () => {}),
  list: vi.fn(async () => ({ blobs: [] })),
  // Authenticated read proxy reads private blobs via get(); default to
  // not-found so route tests opt in explicitly.
  get: vi.fn(async () => null),
}));

// ---------------------------------------------------------------------------
// Reset all mock call history between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});
