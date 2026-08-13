import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = ["komari-theme.json", "preview.png", "dist/index.html"];

for (const file of required) {
  if (!existsSync(resolve(root, file))) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
}

const manifest = JSON.parse(
  readFileSync(resolve(root, "komari-theme.json"), "utf8"),
);

for (const field of [
  "name",
  "short",
  "description",
  "version",
  "author",
  "url",
  "preview",
]) {
  if (typeof manifest[field] !== "string") {
    console.error(`invalid komari-theme.json: ${field} must be a string`);
    process.exit(1);
  }
}

const version = process.env.VITE_THEME_VERSION || manifest.version;
if (manifest.version !== version) {
  console.error(
    `version mismatch: VITE_THEME_VERSION=${version}, komari-theme.json=${manifest.version}`,
  );
  process.exit(1);
}

const zipName = `komari-theme-slate-v${version}.zip`;
rmSync(resolve(root, zipName), { force: true });

const result = spawnSync(
  "zip",
  ["-r", "-q", zipName, "komari-theme.json", "preview.png", "dist"],
  { cwd: root, stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`wrote ${zipName}`);
