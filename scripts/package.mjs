import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const zipName = "komari-theme-slate.zip";
const required = ["komari-theme.json", "preview.png", "dist/index.html"];

for (const file of required) {
  if (!existsSync(resolve(root, file))) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
}

const result = spawnSync(
  "zip",
  ["-r", zipName, "komari-theme.json", "preview.png", "dist"],
  { cwd: root, stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`wrote ${zipName}`);
