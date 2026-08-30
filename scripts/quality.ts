import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Effect, Schema } from "effect";
import ts from "typescript";

const SOURCE_ROOTS = ["apps", "packages", "scripts"] as const;
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs"]);
const SKIPPED_PARTS = new Set(["_generated", "coverage", "node_modules"]);
const EXTENSION_PATTERN = /\.d\.ts$|\.[^.]+$/u;
const WORD_SEPARATOR_PATTERN = /[._-]+/u;

class QualityError extends Schema.TaggedError<QualityError>()("QualityError", {
  violations: Schema.Array(Schema.String),
}) {}

/** Determines whether a filesystem entry belongs to generated or external code. */
function isSkipped(filePath: string) {
  return filePath.split(path.sep).some((part) => SKIPPED_PARTS.has(part));
}

/** Counts capability words in a folder or source filename. */
function wordCount(filePath: string) {
  const extensionless = path.basename(filePath).replace(EXTENSION_PATTERN, "");
  return extensionless.split(WORD_SEPARATOR_PATTERN).filter(Boolean).length;
}

/** Recursively lists hand-written source files through an Effect program. */
const walk: (
  directory: string
) => Effect.Effect<readonly string[], QualityError> = Effect.fn("quality.walk")(
  function* (directory) {
    const entries = yield* Effect.tryPromise({
      catch: () =>
        new QualityError({ violations: [`Cannot read ${directory}`] }),
      try: () => readdir(directory, { withFileTypes: true }),
    });
    const files = yield* Effect.forEach(
      entries,
      (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (isSkipped(entryPath)) {
          return Effect.succeed<readonly string[]>([]);
        }
        if (entry.isDirectory()) {
          return walk(entryPath);
        }
        return Effect.succeed(
          SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : []
        );
      },
      { concurrency: "unbounded" }
    );
    return files.flat();
  }
);

/** Checks whether a named function or method has a leading JSDoc contract. */
function hasJsDoc(node: ts.Node) {
  return ts.getJSDocCommentsAndTags(node).length > 0;
}

/** Returns a stable display name for a named function-like declaration. */
function functionName(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (ts.isVariableStatement(node)) {
    const [declaration] = node.declarationList.declarations;
    if (declaration && ts.isIdentifier(declaration.name)) {
      return declaration.name.text;
    }
  }
  return null;
}

/** Identifies declarations that form a named hand-written function contract. */
function isFunctionContract(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return functionName(node) !== null;
  }
  if (!ts.isVariableStatement(node)) {
    return false;
  }
  const [declaration] = node.declarationList.declarations;
  if (!declaration?.initializer) {
    return false;
  }
  if (
    ts.isArrowFunction(declaration.initializer) ||
    ts.isFunctionExpression(declaration.initializer)
  ) {
    return true;
  }
  return (
    ts.isCallExpression(declaration.initializer) &&
    declaration.initializer.getText().startsWith("Effect.fn")
  );
}

/** Finds missing JSDoc contracts in one parsed source module. */
function jsDocViolations(filePath: string, source: string) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const violations: string[] = [];

  /** Visits each syntax node while retaining its source position. */
  function visit(node: ts.Node) {
    if (isFunctionContract(node) && !hasJsDoc(node)) {
      const location = sourceFile.getLineAndCharacterOfPosition(
        node.getStart()
      );
      violations.push(
        `${filePath}:${location.line + 1} ${functionName(node) ?? "function"} needs JSDoc`
      );
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

/** Audits import, naming, and JSDoc conventions owned by the repository. */
const audit = Effect.fn("quality.audit")(function* () {
  const roots = SOURCE_ROOTS.map((root) => path.resolve(root));
  const files = (yield* Effect.forEach(roots, walk, {
    concurrency: "unbounded",
  })).flat();
  const naming = files
    .filter((filePath) => wordCount(filePath) > 2)
    .map((filePath) => `${filePath} has more than two filename words`);
  const docs = (yield* Effect.forEach(
    files,
    (filePath) =>
      Effect.tryPromise({
        catch: () =>
          new QualityError({ violations: [`Cannot read ${filePath}`] }),
        try: () => readFile(filePath, "utf8"),
      }).pipe(Effect.map((source) => jsDocViolations(filePath, source))),
    { concurrency: "unbounded" }
  )).flat();
  const violations = [...naming, ...docs];
  if (violations.length > 0) {
    return yield* new QualityError({ violations });
  }
  yield* Effect.log("Repository quality contracts passed.");
});

const program = audit().pipe(
  Effect.catchTag("QualityError", (error) =>
    Effect.sync(() => {
      process.stderr.write(`${error.violations.join("\n")}\n`);
      process.exitCode = 1;
    })
  )
);

Effect.runPromise(program);
