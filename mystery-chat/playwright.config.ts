import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:58621',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1 --port 58621',
    url: 'http://127.0.0.1:58621',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
