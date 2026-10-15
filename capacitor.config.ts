import type { CapacitorConfig } from '@capacitor/cli';

import { NATIVE_APP_ID, NATIVE_UA_MARKER } from './src/lib/platform/native';

// Native-shell config for the App Store / Play pivot — the iOS and Android
// apps are this web app loaded from production inside a Capacitor webview.
// See docs/hearth-native-app-plan-v1.md (Phase 2).
const config: CapacitorConfig = {
  appId: NATIVE_APP_ID,
  appName: 'Hearth',
  // Required by the CLI even for a remote-url app; with server.url set the
  // copied assets are never served, so the web public/ dir stands in.
  webDir: 'public',
  server: {
    // www is canonical: the apex 307s to it, and Capacitor hands a redirect to
    // any host outside server.url/allowNavigation to Safari — so an apex URL
    // would bounce the app out of its own webview on launch.
    url: 'https://www.hearth-lms.com',
    // Hosts allowed to navigate *inside* the webview. Deliberately minimal:
    // OAuth (Google, Apple) must leave the webview via @capacitor/browser —
    // Google returns disallowed_useragent for embedded webviews — so
    // accounts.google.com is intentionally absent.
    allowNavigation: [
      // Clerk dev/test frontend API (pk_test instance).
      '*.accounts.dev',
      // Clerk production frontend API once the prod instance is configured.
      'clerk.hearth-lms.com',
    ],
  },
  // Server-side native detection keys off this marker (isNativeRequest); the
  // import guarantees the two can never drift. The /1 suffix versions the
  // shell so a future breaking shell change can be told apart server-side.
  appendUserAgent: `${NATIVE_UA_MARKER}/1`,
};

export default config;
