import { defineConfig } from '@playwright/test';

const port = Number(process.env.MUSEUM_TEST_PORT ?? 48763);

export default defineConfig({
  testDir: './tests',
  use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1440, height: 900 } },
  webServer: { command: `bun run preview --host 127.0.0.1 --port ${port}`, port, reuseExistingServer: false }
});
