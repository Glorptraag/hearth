import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Sanity CDN — module/activity/asset thumbnails sourced from CMS.
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      // Vercel Blob — parent-uploaded evidence photos via /api/evidence/upload.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  // Task 5.1 — /explore/activities was the legacy library-scoped catalog
  // browser; that function moved into Library Browse tab in Phase 4.6.
  // 308 (permanent) keeps any saved bookmark resolving + signals to search
  // engines that the canonical home shifted.
  async redirects() {
    return [
      {
        source: '/explore/activities',
        destination: '/library?tab=browse',
        permanent: true,
      },
    ];
  },
};

// Sentry is wired via instrumentation.ts / instrumentation-client.ts. This
// wrapper enables source-map uploads + Sentry's tunnelling route. If the
// SENTRY_* env vars are not set, withSentryConfig is a near no-op in dev.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
});
