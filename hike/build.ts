import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename } from "node:path";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });

const result = await Bun.build({
  entrypoints: ["src/main.ts"],
  outdir: "dist/assets",
  naming: "[name]-[hash].[ext]",
  minify: true,
  sourcemap: "none",
  target: "browser",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const js = result.outputs.find((output) => output.path.endsWith(".js"));
const css = result.outputs.find((output) => output.path.endsWith(".css"));
if (!js || !css) throw new Error("Expected JavaScript and CSS build outputs");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#e9b65f" />
  <meta name="description" content="A tiny hike full of things that do not quite belong." />
  <title>Hike — a mountain of small mysteries</title>
  <link rel="stylesheet" href="./assets/${basename(css.path)}" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./assets/${basename(js.path)}"></script>
</body>
</html>`;

await writeFile("dist/index.html", html);
console.log(`Built ${result.outputs.length} assets in dist/`);
