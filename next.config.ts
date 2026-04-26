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
