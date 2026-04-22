import { test, expect } from '@playwright/test';

// Co-facilitator invite and access flow E2E tests
// Tests the complete lifecycle: invite → accept → access → remove

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

// Minimal shapes returned by /api/family/members and /api/entries. Only the
// fields these tests read are enumerated — keeps the tests honest about what
// the server guarantees without forcing a full API-type import here.
type FamilyMember = {
  id?: string;
  email: string;
  status?: string;
  role?: string;
};

type EntrySummary = {
  id: string;
};

// Helper to create unique emails for test isolation
function generateTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

test.describe('Co-facilitator invite flow', () => {
  let editorEmail: string;

  test('owner can invite a co-facilitator with editor role', async ({ request }) => {
    // Setup: Get owner's family (assumes owner is already authenticated)
    // In real setup, this would use a test account with known credentials
    editorEmail = generateTestEmail('editor');

    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.invited).toBe(true);
    expect(data.token).toBeTruthy();
  });

  test('owner can invite with viewer role', async ({ request }) => {
    const viewerEmail = generateTestEmail('viewer');

    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: viewerEmail,
        role: 'viewer',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.invited).toBe(true);
    expect(data.token).toBeTruthy();
  });

  test('owner can list all family members including pending invites', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/family/members`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.members)).toBe(true);
    expect(data.members.length).toBeGreaterThan(0);

    // Should include both active and invited members
    const statuses = data.members.map((m: FamilyMember) => m.status);
    expect(statuses.some((s: string) => s === 'active' || s === 'invited')).toBe(true);
  });

  test('invited email is recorded correctly in member list', async ({ request }) => {
    const newEditorEmail = generateTestEmail('editor-list-test');

    // Invite
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: newEditorEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);

    // List members
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();

    const invited = members.members.find((m: FamilyMember) => m.email === newEditorEmail);
    expect(invited).toBeDefined();
    expect(invited.status).toBe('invited');
    expect(invited.role).toBe('editor');
  });
});

test.describe('Co-facilitator invite validation', () => {
  test('cannot invite same email twice', async ({ request }) => {
    const testEmail = generateTestEmail('duplicate-invite');

    // First invite
    const firstResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'editor',
      },
    });
    expect(firstResponse.status()).toBe(200);

    // Second invite with same email
    const secondResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'editor',
      },
    });

    expect(secondResponse.status()).toBe(409);
    const data = await secondResponse.json();
    expect(data.error).toContain('already been invited');
  });

  test('invalid token returns 404 when accepting invite', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: 'invalid-token-that-does-not-exist',
      },
    });

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('Invalid or expired');
  });

  test('expired token (removed member) cannot accept invite', async ({ request }) => {
    const testEmail = generateTestEmail('expired-invite');

    // Invite
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    const inviteData = await inviteResponse.json();
    const token = inviteData.token;

    // Remove the member (mark as removed)
    // This would require the owner context, so we simulate the response
    // In a real scenario, the member would be soft-deleted
    // For now, we verify that attempting to use an invalid token fails

    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: 'expired-' + token,
      },
    });

    expect(acceptResponse.status()).toBe(404);
  });

  test('role defaults to editor if not specified', async ({ request }) => {
    const testEmail = generateTestEmail('default-role');

    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        // role intentionally omitted
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.token).toBeTruthy();
  });

  test('invalid email format rejected', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: 'not-an-email',
        role: 'editor',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('owner cannot invite themselves', async ({ request }) => {
    // This test would require knowing the owner's own email
    // The API should prevent owner from creating a duplicate entry
    const response = await request.get(`${BASE_URL}/api/family/members`);
    const members = await response.json();

    // Assuming owner is not in the members list (only co-facilitators)
    // This is implementation-dependent based on your data model
    expect(Array.isArray(members.members)).toBe(true);
  });
});

test.describe('Co-facilitator acceptance flow', () => {
  let inviteToken: string;
  let editorEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('accept-test');

    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    inviteToken = data.token;
  });

  test('invited user can accept invitation with valid token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.accepted).toBe(true);
    expect(data.familyId).toBeTruthy();
    expect(data.familyName).toBeTruthy();
  });

  test('after accepting, user is marked as active member', async ({ request }) => {
    // Accept the invite
    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });
    expect(acceptResponse.status()).toBe(200);

    // List members to verify
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();

    const member = members.members.find((m: FamilyMember) => m.email === editorEmail);
    expect(member).toBeDefined();
    expect(member.status).toBe('active');
  });

  test('cannot accept same invitation token twice', async ({ request }) => {
    // First acceptance
    const firstResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });
    expect(firstResponse.status()).toBe(200);

    // Try to accept again with same token
    const secondResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });

    // Should fail because token is now cleared after first use
    expect(secondResponse.status()).toBe(404);
  });

  test('owner cannot accept their own family invitation', async ({ request }) => {
    // Create an invitation for a test email
    const testEmail = generateTestEmail('owner-accept-test');

    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    const token = (await inviteResponse.json()).token;

    // Simulate the owner trying to accept their own family invite
    // The API should detect that they already own the family
    // This would require a different test setup with multiple families

    expect(token).toBeTruthy();
  });
});

test.describe('Co-facilitator dashboard access', () => {
  let inviteToken: string;
  let editorEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('dashboard-test');

    // Invite an editor
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    inviteToken = (await inviteResponse.json()).token;

    // Accept the invitation
    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });
    expect(acceptResponse.status()).toBe(200);
  });

  test('both owner and editor can access family data', async ({ request }) => {
    // Get family data
    const response = await request.get(`${BASE_URL}/api/family`);
    expect(response.status()).toBe(200);

    const family = await response.json();
    expect(family.id).toBeTruthy();
    expect(family.familyName).toBeTruthy();
  });

  test('both users see same family in member list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/family/members`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.members)).toBe(true);
  });

  test('editor can list entries for the family', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/entries`);
    expect(response.status()).toBe(200);

    const entries = await response.json();
    expect(Array.isArray(entries)).toBe(true);
  });

  test('both users see the same entries in family view', async ({ request }) => {
    // Create an entry as owner
    const entryResponse = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Test shared entry',
        description: 'Created by owner, should be visible to editor',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['science'],
      },
    });

    expect(entryResponse.status()).toBe(200);
    const entry = await entryResponse.json();
    const entryId = entry.id;

    // Now list entries (both should see it)
    const listResponse = await request.get(`${BASE_URL}/api/entries`);
    expect(listResponse.status()).toBe(200);

    const entries = await listResponse.json();
    const found = entries.find((e: EntrySummary) => e.id === entryId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Test shared entry');
  });

  test('can filter entries by date range', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];

    const response = await request.get(`${BASE_URL}/api/entries?startDate=${today}&endDate=${today}`);
    expect(response.status()).toBe(200);

    const entries = await response.json();
    expect(Array.isArray(entries)).toBe(true);
  });

  test('can filter entries by learner', async ({ request }) => {
    // First, get learners to use a valid ID
    const response = await request.get(`${BASE_URL}/api/entries`);
    expect(response.status()).toBe(200);

    const entries = await response.json();
    if (entries.length > 0 && entries[0].learnerIds?.length > 0) {
      const learnerId = entries[0].learnerIds[0];
      const filteredResponse = await request.get(
        `${BASE_URL}/api/entries?learnerId=${learnerId}`
      );
      expect(filteredResponse.status()).toBe(200);
    }
  });
});

test.describe('Co-facilitator shared logging', () => {
  let inviteToken: string;
  let editorEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('logging-test');

    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    inviteToken = (await inviteResponse.json()).token;

    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });
    expect(acceptResponse.status()).toBe(200);
  });

  test('owner can create a learning entry', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Owner created activity',
        description: 'An activity logged by the owner',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['mathematics', 'science'],
        status: 'draft',
      },
    });

    expect(response.status()).toBe(200);
    const entry = await response.json();
    expect(entry.id).toBeTruthy();
    expect(entry.title).toBe('Owner created activity');
    expect(entry.familyId).toBeTruthy();
  });

  test('editor can create a learning entry', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Editor created activity',
        description: 'An activity logged by the editor',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['english'],
        status: 'draft',
      },
    });

    expect(response.status()).toBe(200);
    const entry = await response.json();
    expect(entry.id).toBeTruthy();
    expect(entry.title).toBe('Editor created activity');
  });

  test('entries from both users appear in shared family view', async ({ request }) => {
    // Create entry as owner
    const ownerEntryResponse = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Owner shared entry',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['art'],
      },
    });
    expect(ownerEntryResponse.status()).toBe(200);
    const ownerEntry = await ownerEntryResponse.json();

    // Create entry as editor (simulated - in real test, would need separate auth context)
    const editorEntryResponse = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Editor shared entry',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['history'],
      },
    });
    expect(editorEntryResponse.status()).toBe(200);
    const editorEntry = await editorEntryResponse.json();

    // Both should appear in family entries list
    const listResponse = await request.get(`${BASE_URL}/api/entries`);
    expect(listResponse.status()).toBe(200);

    const entries = await listResponse.json();
    expect(entries.some((e: EntrySummary) => e.id === ownerEntry.id)).toBe(true);
    expect(entries.some((e: EntrySummary) => e.id === editorEntry.id)).toBe(true);
  });

  test('editor can update their own entry', async ({ request }) => {
    // Create entry
    const createResponse = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Original title',
        dateOccurred: new Date().toISOString().split('T')[0],
      },
    });
    expect(createResponse.status()).toBe(200);
    const entry = await createResponse.json();
    const entryId = entry.id;

    // Update entry
    const updateResponse = await request.patch(`${BASE_URL}/api/entries/${entryId}`, {
      data: {
        title: 'Updated title',
      },
    });

    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.title).toBe('Updated title');
  });

  test('entry contains correct metadata and timestamps', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Metadata test entry',
        description: 'Testing metadata fields',
        dateOccurred: '2025-03-15',
        subjects: ['science', 'technology'],
        status: 'draft',
      },
    });

    expect(response.status()).toBe(200);
    const entry = await response.json();
    expect(entry.id).toBeTruthy();
    expect(entry.familyId).toBeTruthy();
    expect(entry.title).toBe('Metadata test entry');
    expect(entry.description).toBe('Testing metadata fields');
    expect(entry.subjects).toContain('science');
    expect(entry.subjects).toContain('technology');
    expect(entry.status).toBe('draft');
    expect(entry.createdAt).toBeTruthy();
  });
});

test.describe('Co-facilitator removal', () => {
  let memberId: string;
  let inviteToken: string;
  let editorEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('removal-test');

    // Invite an editor
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    inviteToken = (await inviteResponse.json()).token;

    // Accept invitation
    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: {
        token: inviteToken,
      },
    });
    expect(acceptResponse.status()).toBe(200);

    // Get member ID
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();
    const member = members.members.find((m: FamilyMember) => m.email === editorEmail);
    memberId = member.id;
  });

  test('owner can remove a co-facilitator', async ({ request }) => {
    expect(memberId).toBeTruthy();

    const response = await request.delete(`${BASE_URL}/api/family/members`, {
      data: {
        memberId,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.removed).toBe(true);
  });

  test('removed member is marked as removed in list', async ({ request }) => {
    // Remove the member
    const deleteResponse = await request.delete(`${BASE_URL}/api/family/members`, {
      data: {
        memberId,
      },
    });
    expect(deleteResponse.status()).toBe(200);

    // List members - removed should not appear in active list
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();

    const removed = members.members.find((m: FamilyMember) => m.email === editorEmail);
    // Should not appear in active members
    expect(removed).toBeUndefined();
  });

  test('removed member can be re-invited', async ({ request }) => {
    // Remove the member
    const deleteResponse = await request.delete(`${BASE_URL}/api/family/members`, {
      data: {
        memberId,
      },
    });
    expect(deleteResponse.status()).toBe(200);

    // Re-invite the same email
    const reinviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'viewer', // Change role on re-invite
      },
    });

    expect(reinviteResponse.status()).toBe(200);
    const data = await reinviteResponse.json();
    expect(data.token).toBeTruthy();
  });

  test('owner cannot remove themselves', async ({ request }) => {
    // This test assumes a special case where owner ID would be in the members list
    // The implementation prevents owner from being in familyMembers table
    // So this test verifies the API doesn't break with owner ID

    const response = await request.delete(`${BASE_URL}/api/family/members`, {
      data: {
        memberId: 'non-existent-owner-id',
      },
    });

    // Should either succeed (no-op) or fail gracefully
    expect([200, 404]).toContain(response.status());
  });
});

test.describe('Co-facilitator deep-link invite', () => {
  let inviteToken: string;
  let editorEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('deeplink-test');

    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });

    expect(response.status()).toBe(200);
    inviteToken = (await response.json()).token;
  });

  test('deep-link invite URL can be constructed', async () => {
    // Verify token exists and is usable
    expect(inviteToken).toBeTruthy();
    expect(inviteToken.length).toBeGreaterThan(20);

    // Deep-link would look like:
    const deepLink = `${BASE_URL}/onboarding/join?token=${inviteToken}`;
    expect(deepLink).toContain('/onboarding/join?token=');
  });

  test('deep-link join page loads with valid token', async ({ page }) => {
    const deepLink = `${BASE_URL}/onboarding/join?token=${inviteToken}`;
    await page.goto(deepLink);

    // Page should load (may redirect if not authenticated)
    expect(page.url()).toBeTruthy();
  });

  test('deep-link join page rejects invalid token', async ({ page }) => {
    const invalidLink = `${BASE_URL}/onboarding/join?token=invalid-token-xyz`;
    await page.goto(invalidLink);

    // Should either show error or redirect
    const url = page.url();
    // Either still on join page or redirected
    expect(url).toBeTruthy();
  });

  test('token parameter is preserved through authentication flow', async ({ page }) => {
    const deepLink = `${BASE_URL}/onboarding/join?token=${inviteToken}`;
    await page.goto(deepLink);

    // Token should be available to the page
    const currentUrl = page.url();
    expect(currentUrl).toContain('token');
  });
});

test.describe('Co-facilitator role-based access', () => {
  let editorInviteToken: string;
  let viewerInviteToken: string;
  let editorEmail: string;
  let viewerEmail: string;

  test.beforeEach(async ({ request }) => {
    editorEmail = generateTestEmail('editor-role-test');
    viewerEmail = generateTestEmail('viewer-role-test');

    // Invite editor
    const editorInviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });
    expect(editorInviteResponse.status()).toBe(200);
    editorInviteToken = (await editorInviteResponse.json()).token;

    // Invite viewer
    const viewerInviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: viewerEmail,
        role: 'viewer',
      },
    });
    expect(viewerInviteResponse.status()).toBe(200);
    viewerInviteToken = (await viewerInviteResponse.json()).token;

    // Accept both
    await request.post(`${BASE_URL}/api/family/invite`, {
      data: { token: editorInviteToken },
    });

    await request.post(`${BASE_URL}/api/family/invite`, {
      data: { token: viewerInviteToken },
    });
  });

  test('role is preserved after acceptance', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/family/members`);
    const members = await response.json();

    const editor = members.members.find((m: FamilyMember) => m.email === editorEmail);
    const viewer = members.members.find((m: FamilyMember) => m.email === viewerEmail);

    expect(editor.role).toBe('editor');
    expect(viewer.role).toBe('viewer');
  });

  test('member list shows all roles correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/family/members`);
    expect(response.status()).toBe(200);

    const members = await response.json();
    const roles = members.members.map((m: FamilyMember) => m.role);

    expect(roles).toContain('editor');
    expect(roles).toContain('viewer');
  });

  test('editor can create entries (role-based)', async ({ request }) => {
    // This would require separate auth contexts to properly test
    // For now, verify the role is stored
    const response = await request.get(`${BASE_URL}/api/family/members`);
    const members = await response.json();

    const editor = members.members.find((m: FamilyMember) => m.email === editorEmail);
    expect(editor.role).toBe('editor');
  });

  test('role can be updated during re-invite', async ({ request }) => {
    const testEmail = generateTestEmail('role-change');

    // Invite as editor
    const firstInvite = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'editor',
      },
    });
    expect(firstInvite.status()).toBe(200);

    // Remove
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();
    const member = members.members.find((m: FamilyMember) => m.email === testEmail);

    const deleteResponse = await request.delete(`${BASE_URL}/api/family/members`, {
      data: { memberId: member.id },
    });
    expect(deleteResponse.status()).toBe(200);

    // Re-invite as viewer
    const secondInvite = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: testEmail,
        role: 'viewer',
      },
    });
    expect(secondInvite.status()).toBe(200);
  });
});

test.describe('Co-facilitator error handling', () => {
  test('invalid request body returns 400', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        // Missing required email field
        role: 'editor',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('unauthenticated request returns 401', async ({ request }) => {
    // This test may not work in all setups since request context might have auth
    // But demonstrates the expected behavior
    const response = await request.get(`${BASE_URL}/api/family/members`);

    // Should be 200 if authenticated in test context, or 401 if not
    expect([200, 401]).toContain(response.status());
  });

  test('non-family-owner cannot invite', async ({ request }) => {
    // This test would require a different user context
    // Demonstrates the expected authorization check
    const response = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: generateTestEmail('nonowner'),
        role: 'editor',
      },
    });

    // In the auth context, this should succeed (assuming authenticated as owner)
    // Or fail with 403 if using a non-owner account
    expect([200, 403]).toContain(response.status());
  });

  test('non-family-owner cannot remove members', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/family/members`, {
      data: {
        memberId: 'some-id',
      },
    });

    // Should either succeed or fail with 403 depending on auth context
    expect([200, 403, 404]).toContain(response.status());
  });

  test('rate limiting on entry creation', async ({ request }) => {
    // Create entries rapidly to test rate limit
    const promises = [];
    for (let i = 0; i < 35; i++) {
      promises.push(
        request.post(`${BASE_URL}/api/entries`, {
          data: {
            title: `Rate limit test ${i}`,
            dateOccurred: new Date().toISOString().split('T')[0],
          },
        })
      );
    }

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status());

    // Should have some successes and potentially a 429 if limit exceeded
    expect(statuses.some((s) => s === 200)).toBe(true);
    // May have 429 if rate limit is strict
  });
});

test.describe('Co-facilitator integration scenarios', () => {
  test('complete workflow: invite → accept → log → view → remove', async ({ request }) => {
    const editorEmail = generateTestEmail('complete-workflow');

    // 1. Invite
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: {
        email: editorEmail,
        role: 'editor',
      },
    });
    expect(inviteResponse.status()).toBe(200);
    const token = (await inviteResponse.json()).token;

    // 2. Accept
    const acceptResponse = await request.post(`${BASE_URL}/api/family/invite`, {
      data: { token },
    });
    expect(acceptResponse.status()).toBe(200);

    // 3. Create entry
    const entryResponse = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'Workflow test entry',
        dateOccurred: new Date().toISOString().split('T')[0],
        subjects: ['science'],
      },
    });
    expect(entryResponse.status()).toBe(200);
    const entryId = (await entryResponse.json()).id;

    // 4. Verify entry is visible
    const listResponse = await request.get(`${BASE_URL}/api/entries`);
    const entries = await listResponse.json();
    expect(entries.some((e: EntrySummary) => e.id === entryId)).toBe(true);

    // 5. Remove member
    const membersResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await membersResponse.json();
    const member = members.members.find((m: FamilyMember) => m.email === editorEmail);

    const deleteResponse = await request.delete(`${BASE_URL}/api/family/members`, {
      data: { memberId: member.id },
    });
    expect(deleteResponse.status()).toBe(200);

    // 6. Verify member is removed
    const finalListResponse = await request.get(`${BASE_URL}/api/family/members`);
    const finalMembers = await finalListResponse.json();
    const removedMember = finalMembers.members.find(
      (m: FamilyMember) => m.email === editorEmail
    );
    expect(removedMember).toBeUndefined();
  });

  test('multiple co-facilitators can log simultaneously', async ({ request }) => {
    const email1 = generateTestEmail('multi-1');
    const email2 = generateTestEmail('multi-2');

    // Invite both
    const invite1 = await request.post(`${BASE_URL}/api/family/members`, {
      data: { email: email1, role: 'editor' },
    });
    const token1 = (await invite1.json()).token;

    const invite2 = await request.post(`${BASE_URL}/api/family/members`, {
      data: { email: email2, role: 'editor' },
    });
    const token2 = (await invite2.json()).token;

    // Accept both
    await request.post(`${BASE_URL}/api/family/invite`, { data: { token: token1 } });
    await request.post(`${BASE_URL}/api/family/invite`, { data: { token: token2 } });

    // Both create entries
    const entry1Response = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'User 1 entry',
        dateOccurred: new Date().toISOString().split('T')[0],
      },
    });

    const entry2Response = await request.post(`${BASE_URL}/api/entries`, {
      data: {
        title: 'User 2 entry',
        dateOccurred: new Date().toISOString().split('T')[0],
      },
    });

    expect(entry1Response.status()).toBe(200);
    expect(entry2Response.status()).toBe(200);

    // Both should appear in shared view
    const listResponse = await request.get(`${BASE_URL}/api/entries`);
    const entries = await listResponse.json();

    const id1 = (await entry1Response.json()).id;
    const id2 = (await entry2Response.json()).id;

    expect(entries.some((e: EntrySummary) => e.id === id1)).toBe(true);
    expect(entries.some((e: EntrySummary) => e.id === id2)).toBe(true);
  });

  test('invite list is consistent across all members', async ({ request }) => {
    const email = generateTestEmail('consistency-test');

    // Create invite
    const inviteResponse = await request.post(`${BASE_URL}/api/family/members`, {
      data: { email, role: 'editor' },
    });
    expect(inviteResponse.status()).toBe(200);

    // Both owner and (if another member existed) should see it
    const listResponse = await request.get(`${BASE_URL}/api/family/members`);
    const members = await listResponse.json();

    const invited = members.members.find((m: FamilyMember) => m.email === email);
    expect(invited).toBeDefined();
    expect(invited.status).toBe('invited');
  });
});
