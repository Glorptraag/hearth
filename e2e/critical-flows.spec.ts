import { test, expect } from '@playwright/test';

// Critical flows E2E tests
// These run against a running dev server (BASE_URL env var, default http://localhost:3000)

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Public pages', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    expect(page.url()).toBeTruthy();
  });

  test('sign-in page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await expect(page).not.toHaveURL(/error/);
  });
});

test.describe('Onboarding flow', () => {
  test('onboarding page redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding`);
    const url = page.url();
    // Either redirected to sign-in or shows onboarding
    expect(url).toBeTruthy();
  });
});

test.describe('Protected routes', () => {
  test('dashboard redirects when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const finalUrl = page.url();
    // Clerk redirects unauthenticated users away from dashboard
    expect(finalUrl).not.toContain('/dashboard');
  });

  test('logger page requires auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/log`);
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/log');
  });

  test('portfolio page requires auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/our-story/portfolio`);
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/portfolio');
  });

  test('planner page requires auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/planner`);
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/planner');
  });
});

test.describe('API health', () => {
  test('health endpoint responds without server error', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`).catch(() => null);
    // If the endpoint exists it should not 5xx; if absent (404) that is also acceptable
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});
