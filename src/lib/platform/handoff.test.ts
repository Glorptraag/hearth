import { describe, it, expect, vi } from 'vitest';
import { buildHandoffUrl, redeemHandoff, safeNextPath, type TicketSignIn } from './handoff';

describe('safeNextPath', () => {
  it.each(['/dashboard', '/planner?week=2', '/our-story/report#term-3', '/pack/abc'])(
    'accepts same-origin path %s',
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    ['protocol-relative', '//evil.example/x'],
    ['absolute', 'https://evil.example'],
    ['backslash (browsers read /\\ as //)', '/\\evil.example'],
    ['relative without slash', 'planner'],
    ['empty', ''],
    ['control character', '/dash\nboard'],
    ['sign-in loop', '/sign-in?redirect_url=/x'],
    ['sign-up loop', '/sign-up'],
    ['handoff loop', '/native/handoff?ticket=x'],
    ['over-long', `/${'a'.repeat(2048)}`],
  ])('rejects %s', (_label, path) => {
    expect(safeNextPath(path)).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(['/dashboard'])).toBeNull();
  });
});

describe('buildHandoffUrl', () => {
  it('encodes ticket and next as query params on the handoff path', () => {
    const url = buildHandoffUrl('tok_a+b', '/planner?week=2');
    expect(url.startsWith('/native/handoff?')).toBe(true);
    const params = new URL(url, 'https://www.hearth-lms.com').searchParams;
    expect(params.get('ticket')).toBe('tok_a+b');
    expect(params.get('next')).toBe('/planner?week=2');
  });

  it('produces a URL the handoff accepts back as next-safe', () => {
    // The Swift bridge rejects anything that is not a relative path.
    expect(buildHandoffUrl('t', '/x').startsWith('/')).toBe(true);
  });
});

describe('redeemHandoff', () => {
  function fakeSignIn(overrides: Partial<{ ticketError: unknown; finalizeError: unknown; status: string }> = {}) {
    const state = { status: null as string | null };
    const signIn: TicketSignIn & { ticket: ReturnType<typeof vi.fn>; finalize: ReturnType<typeof vi.fn> } = {
      get status() {
        return state.status;
      },
      ticket: vi.fn(async () => {
        if (!overrides.ticketError) state.status = overrides.status ?? 'complete';
        return { error: overrides.ticketError ?? null };
      }),
      finalize: vi.fn(async () => ({ error: overrides.finalizeError ?? null })),
    };
    return signIn;
  }

  it('redeems the ticket, finalizes, then navigates to next', async () => {
    const signIn = fakeSignIn();
    const navigate = vi.fn();
    const ok = await redeemHandoff({ ticket: 'tok', next: '/planner', isSignedIn: false, signIn, navigate });
    expect(ok).toBe(true);
    expect(signIn.ticket).toHaveBeenCalledWith({ ticket: 'tok' });
    expect(signIn.finalize).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/planner');
  });

  it('skips the ticket when the webview is already signed in', async () => {
    const signIn = fakeSignIn();
    const navigate = vi.fn();
    const ok = await redeemHandoff({ ticket: 'tok', next: '/planner', isSignedIn: true, signIn, navigate });
    expect(ok).toBe(true);
    expect(signIn.ticket).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/planner');
  });

  it('fails without navigating when there is no ticket', async () => {
    const navigate = vi.fn();
    const ok = await redeemHandoff({ ticket: null, next: '/planner', isSignedIn: false, signIn: fakeSignIn(), navigate });
    expect(ok).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('fails when Clerk rejects the ticket (expired or already used)', async () => {
    const signIn = fakeSignIn({ ticketError: new Error('expired') });
    const navigate = vi.fn();
    expect(await redeemHandoff({ ticket: 'tok', next: '/x', isSignedIn: false, signIn, navigate })).toBe(false);
    expect(signIn.finalize).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('fails when the sign-in needs another step instead of completing', async () => {
    const signIn = fakeSignIn({ status: 'needs_second_factor' });
    const navigate = vi.fn();
    expect(await redeemHandoff({ ticket: 'tok', next: '/x', isSignedIn: false, signIn, navigate })).toBe(false);
    expect(signIn.finalize).not.toHaveBeenCalled();
  });

  it('fails when the session cannot be activated', async () => {
    const signIn = fakeSignIn({ finalizeError: new Error('nope') });
    const navigate = vi.fn();
    expect(await redeemHandoff({ ticket: 'tok', next: '/x', isSignedIn: false, signIn, navigate })).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
