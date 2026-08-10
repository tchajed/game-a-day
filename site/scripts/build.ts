import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { games } from "../games";

const siteRoot = resolve(import.meta.dir, "..");
const repoRoot = resolve(siteRoot, "..");

async function run(command: string[], cwd: string) {
  const child = Bun.spawn(command, { cwd, stdout: "inherit", stderr: "inherit" });
  const exitCode = await child.exited;
  if (exitCode !== 0) throw new Error(`${command.join(" ")} failed with exit code ${exitCode}`);
}

await rm(join(siteRoot, "dist"), { recursive: true, force: true });
await run(["bun", "run", "generate"], siteRoot);
await run(["bunx", "tsc", "--noEmit"], siteRoot);
await run(["bunx", "vite", "build"], siteRoot);

for (const game of games) {
  const gameRoot = join(repoRoot, game.directory);
  console.log(`\nBuilding ${game.slug}…`);
  await run(["bunx", "tsc", "--noEmit"], gameRoot);
  await run(
    [
      "bunx",
      "vite",
      "build",
      `--base=/${game.slug}/`,
      `--outDir=${join(siteRoot, "dist", game.slug)}`,
      "--emptyOutDir",
    ],
    gameRoot,
  );
}

console.log(`\nPortfolio and ${games.length} games built in site/dist.`);
