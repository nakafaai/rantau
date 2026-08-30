import { readFile } from "node:fs/promises";
import process from "node:process";

const expected = "4.0.0-rc.112";
const vendoredPackage = new URL(
  "../repos/effect/packages/effect/package.json",
  import.meta.url
);

/** Verifies that vendored Effect source matches the installed runtime. */
async function check() {
  const source = JSON.parse(await readFile(vendoredPackage, "utf8"));
  if (source.version !== expected) {
    throw new Error(
      `Effect source ${source.version} does not match ${expected}.`
    );
  }
  console.log(`Effect source matches ${expected}.`);
}

if (process.argv[2] !== "check") {
  throw new Error("Usage: node scripts/effect-source.mjs check");
}

await check();
