import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const sourcePaths = [
  ".dockerignore",
  ".nvmrc",
  "Dockerfile",
  "docker-compose.yml",
  "drizzle",
  "drizzle.config.ts",
  "messages",
  "next.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "postcss.config.mjs",
  "public",
  "scripts",
  "searxng",
  "src",
  "tsconfig.json",
];

/**
 * Adds a source path and its children to the deterministic build digest.
 *
 * @param hash - Digest shared by all source paths.
 * @param path - Path relative to the application root.
 * @returns Nothing after every file at the path has been hashed.
 */
function hashPath(hash, path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path).sort()) {
      hashPath(hash, join(path, entry));
    }
    return;
  }

  hash.update(relative(".", path).replaceAll("\\", "/"));
  hash.update("\0");
  hash.update(readFileSync(path));
  hash.update("\0");
}

const hash = createHash("sha256");
for (const path of sourcePaths) hashPath(hash, path);
const release = `build-${hash.digest("hex").slice(0, 16)}`;

if (process.argv.includes("--print-release")) {
  process.stdout.write(`${release}\n`);
} else {
  process.stdout.write(`Building release ${release}\n`);
  const result = spawnSync(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    {
      env: { ...process.env, NEXT_PUBLIC_SENTRY_RELEASE: release },
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
