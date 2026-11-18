import { cp, mkdir, writeFile } from "node:fs/promises";

/**
 * Copies the artwork and icons the static demo serves into `demo/public`.
 *
 * @returns A promise that resolves once every asset is in place.
 */
async function prepareDemo(): Promise<void> {
  await mkdir("demo/public", { recursive: true });
  await cp("public/demo", "demo/public/demo", { recursive: true });
  await cp("public/logo.svg", "demo/public/logo.svg");
  await cp("public/icon-192.png", "demo/public/favicon.png");
  await writeFile("demo/public/.nojekyll", "");
}

void prepareDemo().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Preparing the demo failed.",
  );
  process.exitCode = 1;
});
