#!/usr/bin/env bun
import { rmSync } from "node:fs";
import { resolve, join } from "node:path";

const outdir = resolve(import.meta.dir, "../dist");
const entry = resolve(import.meta.dir, "../src/cli.ts");

// Clean
rmSync(outdir, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [entry],
  outdir,
  target: "bun",
  format: "esm",
  minify: true,
  external: [
    "@callumalpass/mdbase",
    "commander",
    "date-fns",
  ],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Prepend shebang (bun build --target bun adds // @bun which must stay after shebang)
const outFile = join(outdir, "cli.js");
const content = await Bun.file(outFile).text();
await Bun.write(outFile, `#!/usr/bin/env bun\n${content}`);

const sizeKB = (Buffer.byteLength(content) / 1024).toFixed(0);
console.log(`dist/cli.js  ${sizeKB} KB`);
