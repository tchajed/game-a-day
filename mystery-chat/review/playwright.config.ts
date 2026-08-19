import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:49174',
    browserName: 'chromium',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1 --port 49174',
    url: 'http://127.0.0.1:49174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
