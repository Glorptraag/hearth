import { describe, expect, it } from 'vitest';

import config from '../../../capacitor.config';
import { NATIVE_UA_MARKER, isNativeRequest } from './native';

// The shell config and the server-side detection are separate files with a
// hard contract: the UA the shell appends must be the UA the server matches.
// This test is the only thing that fails if someone edits one without the
// other reaching production.
describe('capacitor.config.ts ↔ native detection contract', () => {
  it('appends a user agent the server detector recognises', () => {
    expect(config.appendUserAgent).toBeDefined();
    const headers = new Headers({
      'user-agent': `Mozilla/5.0 (iPhone) ${config.appendUserAgent}`,
    });
    expect(isNativeRequest(headers)).toBe(true);
  });

  it('carries the canonical marker, versioned', () => {
    expect(config.appendUserAgent).toBe(`${NATIVE_UA_MARKER}/1`);
  });

  it('loads the production origin', () => {
    expect(config.server?.url).toBe('https://hearth-lms.com');
  });
});
