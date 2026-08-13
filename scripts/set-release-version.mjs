import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const version = process.argv[2]?.trim();
if (!version || !SEMVER_PATTERN.test(version)) {
  console.error(
    "version must be a SemVer value without a v prefix, for example 1.2.3 or 1.2.3-beta.1",
  );
  process.exit(1);
}

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");
const manifestPath = resolve(root, "komari-theme.json");
const envLines = existsSync(envPath)
  ? readFileSync(envPath, "utf8").split(/\r?\n/)
  : [];
const versionLine = `VITE_THEME_VERSION=${version}`;
const versionIndex = envLines.findIndex((line) =>
  line.startsWith("VITE_THEME_VERSION="),
);

if (versionIndex >= 0) {
  envLines[versionIndex] = versionLine;
} else {
  envLines.push(versionLine);
}

writeFileSync(
  envPath,
  `${envLines.filter((line, index) => line || index < envLines.length - 1).join("\n")}\n`,
);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`prepared theme version ${version}`);
