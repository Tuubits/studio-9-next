import { defineConfig, devices } from '@playwright/test';

// Next.js reads .env itself; load it here too so tests can tell whether
// the PayPal client id (Paypal_Client_2026) is configured (it is not in CI unless a secret is added).
try {
  process.loadEnvFile?.('.env');
} catch {}

// Tests run their own server on its own port, never a reused dev server: its
// PayPal calls must go to the local mock, not to PayPal with real credentials.
const PORT = 3100;
const PAYPAL_MOCK = 'http://localhost:4010'; // also in e2e/helpers.ts

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node e2e/paypal-mock.mjs',
      url: `${PAYPAL_MOCK}/__mock/health`,
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        PAYPAL_API_BASE: PAYPAL_MOCK,
        Paypal_secret_2026: 'mock-secret',
        Paypal_Client_2026: process.env.Paypal_Client_2026 || 'mock-client',
      },
    },
  ],
});
