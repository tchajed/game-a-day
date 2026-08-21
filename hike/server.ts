import { existsSync } from "node:fs";
import { join, normalize } from "node:path";

const port = Number(process.env.PORT || 43127);
await import("./build.ts");

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const relative = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "");
    const root = join(process.cwd(), "dist");
    let safePath = normalize(join(root, relative));
    // Mirror a Pages sub-path locally: /hike/assets/foo is served from dist/assets/foo.
    if (!existsSync(safePath) && relative.includes("/assets/")) {
      safePath = normalize(join(root, "assets", relative.split("/assets/")[1]));
    }
    if (!safePath.startsWith(root) || !existsSync(safePath)) {
      return new Response(Bun.file(join(root, "index.html")));
    }
    return new Response(Bun.file(safePath));
  },
});

console.log(`Hike is waiting at http://localhost:${port}`);
