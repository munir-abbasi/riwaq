import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    globals: true,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium', headless: true },
      ],
    },
    include: ['tests/browser/**/*.test.js'],
  },
});
