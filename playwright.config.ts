import { defineConfig, devices } from '@playwright/test';

const PORT = 4201;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `cmd /c "npm run build && npm run start -- -p ${PORT} -H 127.0.0.1"`,
    url: `${baseURL}/setup`,
    reuseExistingServer: true,
    timeout: 180000,
  },
});
