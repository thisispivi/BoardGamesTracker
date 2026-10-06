import { cp, mkdir, writeFile } from "node:fs/promises";

await mkdir("demo/public", { recursive: true });
await cp("public/demo", "demo/public/demo", { recursive: true });
await cp("public/logo.svg", "demo/public/logo.svg");
await cp("public/icon-192.png", "demo/public/favicon.png");
await writeFile("demo/public/.nojekyll", "");
