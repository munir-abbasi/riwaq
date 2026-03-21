#!/usr/bin/env node
/**
 * scripts/smoke-test.cjs
 *
 * Standalone browser smoke test using Playwright.
 * Run: node scripts/smoke-test.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_PATH = path.resolve(__dirname, '../index.html');
const BASE = 'file://' + APP_PATH;

async function run() {
  if (!fs.existsSync(APP_PATH)) {
    console.error('FAIL: index.html not found at', APP_PATH);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE);
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.error('FAIL: Console errors detected:', errors.join(', '));
    await browser.close();
    process.exit(1);
  }

  const input = page.locator('#nameInput');
  const visible = await input.isVisible().catch(() => false);
  if (!visible) {
    console.error('FAIL: #nameInput not visible');
    await browser.close();
    process.exit(1);
  }

  const analyticsFlag = await page.evaluate(() => window.__ANALYTICS_ENABLED__ ?? false);
  if (analyticsFlag !== false) {
    console.error('FAIL: analytics flag should be false by default, got:', analyticsFlag);
    await browser.close();
    process.exit(1);
  }

  const dataMode = await page.evaluate(() => window.__DATA_ENTRY_MODE__ ?? 'chain');
  if (dataMode !== 'chain') {
    console.error('FAIL: data entry mode should be chain, got:', dataMode);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('PASS: App loads, narrator input visible, rollout flags correct.');
}

run().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
