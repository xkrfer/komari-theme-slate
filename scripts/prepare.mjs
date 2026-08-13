import { existsSync } from "node:fs";

if (process.env.CI || !existsSync(".git")) {
  process.exit(0);
}

const husky = await import("husky");
husky.default();
