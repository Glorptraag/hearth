import { createClient, type SanityClient } from '@sanity/client';
import { ConfigError } from '@/lib/db';

/**
 * Sanity client — lazy on both reads and writes.
 *
 * Before 2026-05-25 these `createClient(...)` calls ran at module load. A
 * missing `NEXT_PUBLIC_SANITY_PROJECT_ID` on the deployment turned every
 * file that transitively imported `@/lib/sanity/*` into a hard crash at
 * first import — the same amplifier path the lazy `db` proxy in
 * `@/lib/db` closes for Postgres. We mirror that pattern here so a missing
 * Sanity env var surfaces as a `ConfigError` from `@/lib/db` at first use,
 * which `routeHandler` already tags as `error_kind: config`.
 */

function readSanityConfig() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) {
    throw new ConfigError(
      'NEXT_PUBLIC_SANITY_PROJECT_ID is not set — the Sanity client cannot connect. Check Vercel env vars / .env.local.'
    );
  }
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!dataset) {
    throw new ConfigError(
      'NEXT_PUBLIC_SANITY_DATASET is not set — the Sanity client cannot connect. Check Vercel env vars / .env.local.'
    );
  }
  return { projectId, dataset };
}

let _readClient: SanityClient | null = null;
let _writeClient: SanityClient | null = null;

function getReadClient(): SanityClient {
  if (_readClient) return _readClient;
  const { projectId, dataset } = readSanityConfig();
  _readClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
  });
  return _readClient;
}

function getWriteClient(): SanityClient {
  if (_writeClient) return _writeClient;
  const { projectId, dataset } = readSanityConfig();
  _writeClient = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  });
  return _writeClient;
}

function lazy(getter: () => SanityClient): SanityClient {
  return new Proxy({} as SanityClient, {
    get(_target, prop, receiver) {
      return Reflect.get(getter() as object, prop, receiver);
    },
    has(_target, prop) {
      return prop in (getter() as object);
    },
  });
}

export const sanityClient = lazy(getReadClient);
export const sanityWriteClient = lazy(getWriteClient);
