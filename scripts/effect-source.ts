import { readFile } from "node:fs/promises";
import process from "node:process";
import { Effect, Schema } from "effect";

const EXPECTED_EFFECT_VERSION = "4.0.0-rc.112";
const vendoredPackage = new URL(
  "../repos/effect/packages/effect/package.json",
  import.meta.url
);
const EffectManifest = Schema.Struct({ version: Schema.String });

class EffectSourceError extends Schema.TaggedError<EffectSourceError>()(
  "EffectSourceError",
  { message: Schema.String }
) {}

/** Reads and decodes the vendored Effect package manifest. */
const readVendoredManifest = Effect.fn("effectSource.readManifest")(
  function* () {
    const source = yield* Effect.tryPromise({
      catch: () =>
        new EffectSourceError({
          message: "Could not read the vendored Effect package manifest.",
        }),
      try: () => readFile(vendoredPackage, "utf8"),
    });
    return yield* Schema.decodeUnknownEffect(
      Schema.fromJsonString(EffectManifest)
    )(source).pipe(
      Effect.mapError(
        () =>
          new EffectSourceError({
            message: "The vendored Effect package manifest is invalid.",
          })
      )
    );
  }
);

/** Verifies that vendored Effect source matches the installed runtime. */
const checkEffectSource = Effect.fn("effectSource.check")(function* () {
  if (process.argv[2] !== "check") {
    return yield* new EffectSourceError({
      message: "Usage: node scripts/effect-source.ts check",
    });
  }
  const source = yield* readVendoredManifest();
  if (source.version !== EXPECTED_EFFECT_VERSION) {
    return yield* new EffectSourceError({
      message: `Effect source ${source.version} does not match ${EXPECTED_EFFECT_VERSION}.`,
    });
  }
  yield* Effect.log(`Effect source matches ${EXPECTED_EFFECT_VERSION}.`);
});

const program = checkEffectSource().pipe(
  Effect.catchTag("EffectSourceError", (error) =>
    Effect.sync(() => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    })
  )
);

Effect.runPromise(program);
