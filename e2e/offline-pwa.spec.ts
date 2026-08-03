import { test, expect, type Page } from '@playwright/test';

/**
 * Offline / PWA behaviour.
 *
 * This suite reproduces the check App Review actually performs: put the device
 * in airplane mode and see whether the app degrades into a browser error. A
 * white screen there is the standard route to a Guideline 4.2
 * minimum-functionality rejection. See docs/hearth-native-app-plan-v1.md.
 *
 * REQUIRES A PRODUCTION SERVER. The service worker deliberately refuses to
 * register when NODE_ENV !== 'production' (see ServiceWorkerRegistrar), so
 * running these against `npm run dev` will skip.
 *
 *   npm run build && npm run start
 *   npx playwright test offline-pwa.spec.ts
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/** Waits for a service worker to take control of the page. */
async function waitForController(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      await navigator.serviceWorker.ready;
    } catch {
      return false;
    }
    // `ready` resolves on activation; control of *this* page can lag by a tick.
    if (navigator.serviceWorker.controller) return true;
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 5000);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  });
}

test.describe('PWA manifest', () => {
  test('serves a manifest with square opaque icons and both purposes', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/manifest.webmanifest`);
    expect(res.status()).toBe(200);

    const manifest = await res.json();
    expect(manifest.name).toBe('Hearth');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.id).toBe('/');

    // Both purposes must be present as separate assets — the source mark runs
    // to the edge and is clipped by Android's circle crop without padding.
    const purposes = new Set(manifest.icons.map((i: { purpose: string }) => i.purpose));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);

    // Regression: the manifest previously declared a 507x512 file as 512x512.
    for (const icon of manifest.icons) {
      const iconRes = await request.get(`${BASE_URL}${icon.src}`);
      expect(iconRes.status(), `${icon.src} must exist`).toBe(200);
    }
  });

  test('every icon referenced by document metadata exists', async ({ request }) => {
    // Regression: /favicon.ico and /icon.png were referenced by layout.tsx but
    // had never been added to the repo, so both 404'd.
    for (const path of ['/favicon.ico', '/icon.png', '/apple-touch-icon.png']) {
      const res = await request.get(`${BASE_URL}${path}`);
      expect(res.status(), `${path} must exist`).toBe(200);
    }
  });
});

test.describe('Offline fallback', () => {
  test('offline route renders without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/offline`);
    // Must not be bounced to sign-in — the SW precaches this URL, and caching
    // a redirect to /sign-in would make it the offline screen.
    await expect(page).toHaveURL(/\/offline$/);
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /log a moment/i })).toBeVisible();
  });

  test('airplane mode shows the Hearth offline screen, not a browser error', async ({
    page,
    context,
  }) => {
    await page.goto(BASE_URL);

    const controlled = await waitForController(page);
    test.skip(!controlled, 'No service worker — run against a production build');

    // Give the worker a moment to finish precaching /offline.
    await page.waitForTimeout(1500);

    // Airplane mode.
    await context.setOffline(true);

    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

      // The reviewer-visible assertion: Hearth's own words, not Chrome's.
      await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole('link', { name: /log a moment/i })).toBeVisible();

      const body = await page.textContent('body');
      expect(body).not.toMatch(/ERR_INTERNET_DISCONNECTED|No internet|This site can't be reached/i);
    } finally {
      await context.setOffline(false);
    }
  });

  test('recovers to the live app when the network returns', async ({ page, context }) => {
    await page.goto(BASE_URL);

    const controlled = await waitForController(page);
    test.skip(!controlled, 'No service worker — run against a production build');

    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /offline/i })).toBeVisible({ timeout: 10_000 });

    await context.setOffline(false);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    // Back to real content — the offline screen must not be sticky.
    await expect(page.getByRole('heading', { name: /offline/i })).toBeHidden();
  });
});
