/**
 * Integration tests for Hearth session photo privacy (research log R42).
 *
 * Real Postgres via transaction-rollback isolation; blob storage stays mocked.
 * Session photos are children's photos shared across families, so:
 *   - only active members of the hearth may read them (proxy + every list path),
 *   - a family that hasn't consented to evidence sharing never has its photos
 *     shown to another family, and can't upload at all,
 *   - uploads go to PRIVATE storage under the hearth-scoped prefix.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { get, put } from '@vercel/blob';
import { db } from '@/lib/db';
import { sessionEvidence } from '@/lib/db/schema';
import {
  createFamily,
  createHearth,
  createHearthMembership,
  createHearthSession,
  createSessionEvidence,
} from '@/test/db-factories';
import { asUser } from '@/test/clerk-helpers';
import { hearthEvidenceSrc } from '@/lib/hearth-evidence';
import { GET as getPhoto } from './route';
import {
  GET as listEvidence,
  POST as uploadEvidence,
} from '../sessions/[sessionId]/evidence/route';
import { GET as getSession } from '../sessions/[sessionId]/route';
import { GET as getOurStory } from '../our-story/route';

const USERS = {
  viewer: 'user_hearth_viewer',
  sharer: 'user_hearth_sharer',
  private: 'user_hearth_private',
  departed: 'user_hearth_departed',
  outsider: 'user_hearth_outsider',
} as const;

function pathFor(hearthId: string, sessionId: string, familyId: string, file = '1729-abc.jpg') {
  return `hearth-evidence/${hearthId}/${sessionId}/${familyId}/${file}`;
}

async function seed() {
  const [viewer, sharer, priv, departed, outsider] = await Promise.all(
    Object.values(USERS).map((clerkUserId) => createFamily(db, { clerkUserId }))
  );
  const hearth = await createHearth(db, { createdByFamilyId: viewer.id });
  await Promise.all([
    createHearthMembership(db, { hearthId: hearth.id, familyId: viewer.id, role: 'coordinator', consentEvidenceSharing: true }),
    createHearthMembership(db, { hearthId: hearth.id, familyId: sharer.id, consentEvidenceSharing: true }),
    createHearthMembership(db, { hearthId: hearth.id, familyId: priv.id, consentEvidenceSharing: false }),
    createHearthMembership(db, { hearthId: hearth.id, familyId: departed.id, consentEvidenceSharing: true, status: 'left', leftAt: new Date() }),
  ]);
  const session = await createHearthSession(db, {
    hearthId: hearth.id,
    facilitatorFamilyId: viewer.id,
    status: 'completed',
  });
  const photo = async (familyId: string) =>
    createSessionEvidence(db, {
      sessionId: session.id,
      uploadedByFamilyId: familyId,
      fileUrl: pathFor(hearth.id, session.id, familyId),
    });
  const photos = {
    viewer: await photo(viewer.id),
    sharer: await photo(sharer.id),
    private: await photo(priv.id),
    departed: await photo(departed.id),
  };
  return { hearth, session, families: { viewer, sharer, priv, departed, outsider }, photos };
}

function photoReq(hearthId: string, ref: string) {
  return new NextRequest(`http://x/api/hearths/${hearthId}/evidence?ref=${encodeURIComponent(ref)}`);
}

function hearthCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function sessionCtx(id: string, sessionId: string) {
  return { params: Promise.resolve({ id, sessionId }) };
}

function streamResult() {
  return {
    statusCode: 200,
    stream: new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new Uint8Array([1, 2, 3]));
        c.close();
      },
    }),
    headers: new Headers(),
    blob: { contentType: 'image/jpeg', size: 3 },
  } as never;
}

function uploadReq(hearthId: string, sessionId: string, type = 'image/jpeg') {
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3])], 'Matilda at the creek.jpg', { type }));
  return new NextRequest(`http://x/api/hearths/${hearthId}/sessions/${sessionId}/evidence`, {
    method: 'POST',
    body: form,
  });
}

beforeEach(() => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test_token';
});

describe('GET /api/hearths/[id]/evidence — membership', () => {
  it('returns 403 to a family that is not a member, without touching storage', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.outsider });
    const res = await getPhoto(photoReq(hearth.id, photos.sharer.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it('returns 403 to a family that has left the hearth', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.departed });
    const res = await getPhoto(photoReq(hearth.id, photos.sharer.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(403);
  });

  it('streams a consenting family’s photo to an active member via private access', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.viewer });
    vi.mocked(get).mockResolvedValue(streamResult());
    const res = await getPhoto(photoReq(hearth.id, photos.sharer.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(200);
    expect(get).toHaveBeenCalledWith(photos.sharer.fileUrl, { access: 'private' });
    expect(res.headers.get('Cache-Control')).toMatch(/^private/);
  });

  it('returns 404 for a hearth-scoped path with no evidence row in that hearth', async () => {
    const { hearth, session, families } = await seed();
    const other = await createHearth(db, { createdByFamilyId: families.sharer.id });
    const otherSession = await createHearthSession(db, { hearthId: other.id, facilitatorFamilyId: families.sharer.id });
    // Row lives in another hearth, but its path claims this one.
    const forged = pathFor(hearth.id, session.id, families.sharer.id, 'forged.jpg');
    await createSessionEvidence(db, { sessionId: otherSession.id, uploadedByFamilyId: families.sharer.id, fileUrl: forged });
    asUser({ userId: USERS.viewer });
    const res = await getPhoto(photoReq(hearth.id, forged), hearthCtx(hearth.id));
    expect(res.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });
});

describe('GET /api/hearths/[id]/evidence — consent', () => {
  it('hides a non-consenting family’s photo from other members', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.viewer });
    const res = await getPhoto(photoReq(hearth.id, photos.private.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(404);
    expect(get).not.toHaveBeenCalled();
  });

  it('hides a departed family’s photo even though it consented while a member', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.viewer });
    const res = await getPhoto(photoReq(hearth.id, photos.departed.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(404);
  });

  it('still serves a non-consenting family its own photo', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.private });
    vi.mocked(get).mockResolvedValue(streamResult());
    const res = await getPhoto(photoReq(hearth.id, photos.private.fileUrl), hearthCtx(hearth.id));
    expect(res.status).toBe(200);
  });
});

describe('session evidence read paths filter by consent', () => {
  it('GET /sessions/[sessionId]/evidence returns only visible photos, as proxy srcs', async () => {
    const { hearth, session, photos } = await seed();
    asUser({ userId: USERS.viewer });
    const res = await listEvidence(new NextRequest('http://x'), sessionCtx(hearth.id, session.id));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ id: string; fileUrl: string }>;
    expect(body.map((e) => e.id).sort()).toEqual([photos.viewer.id, photos.sharer.id].sort());
    for (const e of body) expect(e.fileUrl).toMatch(new RegExp(`^/api/hearths/${hearth.id}/evidence\\?ref=`));
  });

  it('GET /sessions/[sessionId]/evidence returns 403 to a non-member', async () => {
    const { hearth, session } = await seed();
    asUser({ userId: USERS.outsider });
    const res = await listEvidence(new NextRequest('http://x'), sessionCtx(hearth.id, session.id));
    expect(res.status).toBe(403);
  });

  it('GET /sessions/[sessionId] filters its evidence', async () => {
    const { hearth, session, photos } = await seed();
    asUser({ userId: USERS.sharer });
    const res = await getSession(new NextRequest('http://x'), sessionCtx(hearth.id, session.id));
    const body = (await res.json()) as { evidence: Array<{ id: string; fileUrl: string }> };
    expect(body.evidence.map((e) => e.id).sort()).toEqual([photos.viewer.id, photos.sharer.id].sort());
    expect(body.evidence.find((e) => e.id === photos.sharer.id)?.fileUrl).toBe(
      hearthEvidenceSrc(hearth.id, photos.sharer.fileUrl)
    );
  });

  it('GET /our-story counts and shows only visible photos', async () => {
    const { hearth, photos } = await seed();
    asUser({ userId: USERS.viewer });
    const res = await getOurStory(new NextRequest('http://x'), hearthCtx(hearth.id));
    const body = (await res.json()) as {
      stats: { sharedPhotos: number };
      gallery: Array<{ id: string; fileUrl: string }>;
      timeline: Array<{ session: { photoCount: number } }>;
    };
    expect(body.stats.sharedPhotos).toBe(2);
    expect(body.timeline[0].session.photoCount).toBe(2);
    expect(body.gallery.map((g) => g.id)).not.toContain(photos.private.id);
    expect(body.gallery.map((g) => g.id)).not.toContain(photos.departed.id);
    for (const g of body.gallery) expect(g.fileUrl.startsWith('/api/hearths/')).toBe(true);
  });
});

describe('POST /sessions/[sessionId]/evidence', () => {
  it('refuses an upload from a family that has not consented, storing nothing', async () => {
    const { hearth, session, families } = await seed();
    asUser({ userId: USERS.private });
    const res = await uploadEvidence(uploadReq(hearth.id, session.id), sessionCtx(hearth.id, session.id));
    expect(res.status).toBe(403);
    expect(put).not.toHaveBeenCalled();
    const rows = await db.select().from(sessionEvidence).where(eq(sessionEvidence.uploadedByFamilyId, families.priv.id));
    expect(rows).toHaveLength(1); // only the seeded legacy row
  });

  it('stores a consenting family’s upload privately under the hearth-scoped prefix', async () => {
    const { hearth, session, families } = await seed();
    asUser({ userId: USERS.sharer });
    const res = await uploadEvidence(uploadReq(hearth.id, session.id), sessionCtx(hearth.id, session.id));
    expect(res.status).toBe(201);

    expect(put).toHaveBeenCalledTimes(1);
    const [path, , opts] = vi.mocked(put).mock.calls[0];
    expect(path).toMatch(new RegExp(`^hearth-evidence/${hearth.id}/${session.id}/${families.sharer.id}/\\d+\\.jpg$`));
    expect(path).not.toContain('Matilda');
    expect(opts).toMatchObject({ access: 'private', addRandomSuffix: true, contentType: 'image/jpeg' });

    const body = (await res.json()) as { id: string; fileUrl: string };
    const [row] = await db.select().from(sessionEvidence).where(eq(sessionEvidence.id, body.id));
    expect(row.fileUrl).toBe(path);
    expect(body.fileUrl).toBe(hearthEvidenceSrc(hearth.id, path));
  });

  it('rejects SVG uploads', async () => {
    const { hearth, session } = await seed();
    asUser({ userId: USERS.sharer });
    const res = await uploadEvidence(uploadReq(hearth.id, session.id, 'image/svg+xml'), sessionCtx(hearth.id, session.id));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });
});
