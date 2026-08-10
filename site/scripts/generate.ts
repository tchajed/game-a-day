import { mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";
import { games } from "../games";

const siteRoot = resolve(import.meta.dir, "..");
const repoRoot = resolve(siteRoot, "..");
const coversDir = join(siteRoot, "public", "covers");
const outputFile = join(siteRoot, "src", "generated-games.ts");

function inlineMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pitchMetadata(markdown: string) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1].trim();
  const body = markdown
    .replace(/^#\s+.+$/m, "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith("![") && !part.startsWith("##"));

  if (!title || !body) throw new Error("PITCH.md needs a title and opening paragraph");

  const emphasized = body.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
  return {
    title: inlineMarkdown(title),
    hook: inlineMarkdown(emphasized?.[1] ?? body),
    description: inlineMarkdown(emphasized?.[2] ?? ""),
  };
}

await rm(coversDir, { recursive: true, force: true });
await mkdir(coversDir, { recursive: true });
await mkdir(dirname(outputFile), { recursive: true });

const generated = [];
for (const config of games) {
  const gameRoot = join(repoRoot, config.directory);
  const pitch = await Bun.file(join(gameRoot, "PITCH.md")).text();
  const coverName = `${config.slug}.webp`;
  await sharp(join(gameRoot, config.cover))
    .extract(config.crop)
    .resize(900, 600, { fit: "cover" })
    .webp({ quality: 84 })
    .toFile(join(coversDir, coverName));
  generated.push({
    slug: config.slug,
    date: config.date,
    cover: `/covers/${coverName}`,
    ...pitchMetadata(pitch),
  });
}

await Bun.write(
  outputFile,
  `// Generated from ../*/PITCH.md by scripts/generate.ts. Do not edit.\nexport const games = ${JSON.stringify(generated, null, 2)} as const;\n`,
);

console.log(`Generated portfolio metadata for ${generated.length} games.`);
