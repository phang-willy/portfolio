import { defineConfig, devices } from '@playwright/test';

const adminURL = process.env.E2E_ADMIN_URL ?? 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: adminURL,
    trace: 'retain-on-failure',
    locale: 'fr-FR',
  },
  projects: [
    {
      name: 'public',
      testMatch: /public-auth\.spec\.ts/,
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /admin-flows\.spec\.ts/,
      use: { storageState: '.auth/admin.json' },
    },
    {
      name: 'infra',
      testMatch: /infra\.spec\.ts/,
    },
  ],
});
