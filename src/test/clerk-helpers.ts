/**
 * Per-test helpers for overriding the default Clerk mocks.
 *
 * Default state (set in vitest.setup.ts): signed-in owner of TEST_FAMILY_ID.
 * Use these helpers when a specific test needs a different state.
 *
 * Usage:
 *   import { asSignedOut, asViewer, asOtherFamily } from '@/test/clerk-helpers';
 *
 *   it('returns 401 when signed out', async () => {
 *     asSignedOut();
 *     const res = await POST(new Request('http://x/api/entries', { method: 'POST' }));
 *     expect(res.status).toBe(401);
 *   });
 */
import { vi } from 'vitest';
import { auth, currentUser } from '@clerk/nextjs/server';
import { useAuth, useUser } from '@clerk/nextjs';
import { TEST_USER_ID, TEST_FAMILY_ID, TEST_ORG_ID } from '../../vitest.setup';

type Role = 'owner' | 'editor' | 'viewer';

interface MockAuth {
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
  orgRole: string | null;
  isAuthenticated: boolean;
  has: ReturnType<typeof vi.fn>;
  getToken: ReturnType<typeof vi.fn>;
  redirectToSignIn: ReturnType<typeof vi.fn>;
  protect: ReturnType<typeof vi.fn>;
  sessionClaims: Record<string, unknown>;
}

export function asUser(params: {
  userId?: string;
  familyId?: string;
  role?: Role;
  email?: string;
}) {
  const userId = params.userId ?? TEST_USER_ID;
  const familyId = params.familyId ?? TEST_FAMILY_ID;
  const role = params.role ?? 'owner';
  const email = params.email ?? 'parent@example.com';

  const mockAuth: MockAuth = {
    userId,
    sessionId: `sess_${userId}`,
    orgId: TEST_ORG_ID,
    orgRole: `org:${role}`,
    isAuthenticated: true,
    has: vi.fn(() => true),
    getToken: vi.fn(async () => 'test_token'),
    redirectToSignIn: vi.fn(),
    protect: vi.fn(),
    sessionClaims: { sub: userId },
  };

  const mockUser = {
    id: userId,
    firstName: 'Test',
    lastName: 'Parent',
    fullName: 'Test Parent',
    emailAddresses: [{ id: 'email_1', emailAddress: email }],
    publicMetadata: { familyId, role },
    privateMetadata: {},
    unsafeMetadata: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  vi.mocked(auth).mockResolvedValue(mockAuth as never);
  vi.mocked(currentUser).mockResolvedValue(mockUser as never);
  vi.mocked(useAuth).mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    userId,
    sessionId: `sess_${userId}`,
    orgId: TEST_ORG_ID,
    orgRole: `org:${role}`,
    signOut: vi.fn(async () => {}),
    getToken: vi.fn(async () => 'test_token'),
  } as never);
  vi.mocked(useUser).mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    user: mockUser,
  } as never);

  return { userId, familyId, role };
}

export function asSignedOut() {
  const unauth: MockAuth = {
    userId: null,
    sessionId: null,
    orgId: null,
    orgRole: null,
    isAuthenticated: false,
    has: vi.fn(() => false),
    getToken: vi.fn(async () => null),
    redirectToSignIn: vi.fn(),
    protect: vi.fn(() => {
      throw new Error('Unauthenticated');
    }),
    sessionClaims: {},
  };

  vi.mocked(auth).mockResolvedValue(unauth as never);
  vi.mocked(currentUser).mockResolvedValue(null);
  vi.mocked(useAuth).mockReturnValue({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    orgId: null,
    orgRole: null,
    signOut: vi.fn(async () => {}),
    getToken: vi.fn(async () => null),
  } as never);
  vi.mocked(useUser).mockReturnValue({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  } as never);
}

export const asEditor = (overrides: Partial<Parameters<typeof asUser>[0]> = {}) =>
  asUser({ ...overrides, role: 'editor' });

export const asViewer = (overrides: Partial<Parameters<typeof asUser>[0]> = {}) =>
  asUser({ ...overrides, role: 'viewer' });

export const asOtherFamily = () =>
  asUser({
    userId: 'user_other_1',
    familyId: 'fam_other_1',
    role: 'owner',
    email: 'other@example.com',
  });
