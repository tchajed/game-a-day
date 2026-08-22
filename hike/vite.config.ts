import { defineConfig } from "vite";

export default defineConfig({
  base: "/hike/",
  build: {
    rollupOptions: {
      input: ["index.html", "character.html"],
    },
  },
});
