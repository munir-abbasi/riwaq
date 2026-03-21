/**
 * tests/browser/smoke.test.js
 *
 * Phase 0 Gate 0: Smoke test — verify the app loads without errors
 * and core map-building functionality is accessible.
 *
 * Uses Vitest browser environment with Playwright.
 * Run with: npx vitest run --config vitest.browser.config.js
 */
import { test, expect } from 'vitest';

const APP_PATH = '/home/meer/Isnad-builder/index.html';

test('app loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`file://${APP_PATH}`);
  await page.waitForTimeout(1000);

  expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0);
});

test('map-building input is accessible', async ({ page }) => {
  await page.goto(`file://${APP_PATH}`);
  await page.waitForTimeout(500);

  const input = page.locator('input[placeholder*="Narrator"]').first();
  await expect(input).toBeVisible();
});

test('rollout flags are off by default', async ({ page }) => {
  await page.goto(`file://${APP_PATH}`);
  await page.waitForTimeout(500);

  const analyticsFlag = await page.evaluate(() => {
    return window.__ANALYTICS_ENABLED__ ?? false;
  });
  expect(analyticsFlag).toBe(false);

  const dataMode = await page.evaluate(() => {
    return window.__DATA_ENTRY_MODE__ ?? 'chain';
  });
  expect(dataMode).toBe('chain');
});
