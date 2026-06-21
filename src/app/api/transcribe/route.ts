import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFamily, apiError, routeHandler } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { transcribeAudio, TRANSCRIBE_MAX_BYTES } from '@/lib/ai/transcribe';

// A clip is short; transcription is sub-second to a few seconds. 30s is a
// generous backstop over Deepgram's round-trip.
export const maxDuration = 30;

/**
 * POST /api/transcribe — body is raw audio bytes (audio/webm or audio/mp4),
 * Content-Type carries the container. Returns { transcript }.
 *
 * Scoped runtime AI exception (Logger voice capture) — see lib/ai/transcribe.ts
 * and decision D-LPS-12. Auth-gated, write-permission-gated, and rate-limited;
 * writes nothing.
 */
export const POST = routeHandler(async (request: NextRequest) => {
  // 20 transcriptions/min/user — generous for real dictation, a firm cap on
  // a clip-spamming loop (Deepgram is metered).
  const authResult = await authenticatedFamily({
    rateLimitKey: 'transcribe',
    rateLimit: 20,
  });
  if ('error' in authResult) return authResult.error;

  // Transcription triggers a metered third-party call and feeds the description
  // field a viewer cannot save — gate it behind write permission so a read-only
  // co-facilitator can't spend Deepgram credits (mirrors POST /api/entries).
  const writeCheck = await checkWritePermission(authResult.userId, authResult.family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to transcribe', writeCheck.statusCode);
  }

  const contentType = request.headers.get('content-type') ?? 'audio/webm';
  if (!contentType.startsWith('audio/')) {
    return apiError('Expected an audio/* body', 415);
  }

  // Reject an oversized clip from the Content-Length header before buffering the
  // whole body into memory; the post-read byteLength check stays as the backstop
  // for an absent or untruthful header.
  const declaredLength = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declaredLength) && declaredLength > TRANSCRIBE_MAX_BYTES) {
    return apiError('Audio clip too large', 413);
  }

  const arrayBuffer = await request.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    return apiError('Empty audio body', 400);
  }
  if (arrayBuffer.byteLength > TRANSCRIBE_MAX_BYTES) {
    return apiError('Audio clip too large', 413);
  }

  try {
    const { transcript } = await transcribeAudio(Buffer.from(arrayBuffer), {
      contentType,
    });
    return NextResponse.json({ transcript });
  } catch (err) {
    // A missing key / Deepgram outage shouldn't 500 the Logger — the parent
    // can fall back to typing. Surface a clean 502 the hook maps to a toast.
    console.error('[transcribe/POST] transcription failed:', err);
    return apiError('Transcription unavailable', 502);
  }
}, { route: 'POST /api/transcribe' });
