/**
 * Native-shell detection.
 *
 * The iOS/Android builds are the same web app running inside a Capacitor
 * WKWebView / WebView, loaded from production. Server and client therefore run
 * identical code, and the only thing distinguishing a native request is the
 * user-agent marker Capacitor appends (`appendUserAgent` in capacitor.config.ts).
 *
 * Detection is deliberately **server-side and user-agent based** rather than
 * reading `window.Capacitor`:
 *   - it works in API routes, where there is no window at all;
 *   - it produces one answer for a request, so a server render and its
 *     hydration cannot disagree.
 * Client components read the resolved value from NativeProvider, never from a
 * global during render.
 *
 * This gates the App Store compliance rule that digital purchases must not
 * appear in native builds. See docs/hearth-native-app-plan-v1.md.
 */

/** Appended to the webview UA by capacitor.config.ts. Keep the two in sync. */
export const NATIVE_UA_MARKER = 'HearthNative';

/**
 * Reverse-DNS app id — iOS bundle identifier AND Android package name, so it
 * must stay hyphen-free (Android forbids hyphens). Consumed by the .well-known
 * universal-link routes; capacitor.config.ts must use the same value.
 * Unregistered with either store: changeable until Drew's first submission,
 * permanent after.
 */
export const NATIVE_APP_ID = 'com.hearthlms.app';

/**
 * True when the request comes from the Capacitor shell.
 *
 * Spoofing this from a browser only ever *removes* purchase affordances, so it
 * is not a security boundary and needs no stronger signal.
 */
export function isNativeRequest(headers: Headers): boolean {
  return headers.get('user-agent')?.includes(NATIVE_UA_MARKER) ?? false;
}
