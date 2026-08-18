import { defineConfig } from 'vite';

export default defineConfig({
  // Games are hosted below games.chajed.io/<slug>/.
  base: './',
  build: { chunkSizeWarningLimit: 1500 }
});
