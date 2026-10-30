/**
 * Native-shell detection.
 *
 * The iOS app (SwiftUI, `apple/`) hosts some web pages in a WKWebView loaded
 * from production. Server and client therefore run identical code for those
 * pages, and the only thing distinguishing a native request is the user-agent
 * marker the app appends (`AppConfig.webUserAgentSuffix` in Swift).
 *
 * Detection is deliberately **server-side and user-agent based** rather than
 * reading a client global:
 *   - it works in API routes, where there is no window at all;
 *   - it produces one answer for a request, so a server render and its
 *     hydration cannot disagree.
 * Client components read the resolved value from NativeProvider, never from a
 * global during render.
 *
 * It gates two things for hosted pages: no Stripe purchase affordance (the app
 * sells through StoreKit only) and no web navigation chrome (the native shell
 * owns navigation). See docs/hearth-native-ios-plan-v2.md.
 */

/** Appended to the webview UA by the iOS app. Keep the two in sync. */
export const NATIVE_UA_MARKER = 'HearthNative';

/**
 * Reverse-DNS app id — iOS bundle identifier AND Android package name, so it
 * must stay hyphen-free (Android forbids hyphens). Consumed by the .well-known
 * universal-link routes; the Xcode project's bundle ID must use the same value.
 * Unregistered with either store: changeable until Drew's first submission,
 * permanent after.
 */
export const NATIVE_APP_ID = 'com.hearthlms.app';

/**
 * True when the request comes from a page hosted inside the iOS app.
 *
 * Spoofing this from a browser only ever *removes* purchase affordances, so it
 * is not a security boundary and needs no stronger signal.
 */
export function isNativeRequest(headers: Headers): boolean {
  return headers.get('user-agent')?.includes(NATIVE_UA_MARKER) ?? false;
}
