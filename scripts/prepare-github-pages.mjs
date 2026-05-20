import { copyFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");

await copyFile(join(distDir, "index.html"), join(distDir, "404.html"));
await writeFile(join(distDir, ".nojekyll"), "");

console.log("Prepared GitHub Pages SPA fallback files in dist/");
