import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Effect, Schema } from "effect";
import ts from "typescript";

const SOURCE_ROOTS = ["apps", "packages", "scripts"] as const;
const SOURCE_EXTENSIONS = new Set([".cjs", ".js", ".mjs", ".ts", ".tsx"]);
const SKIPPED_PARTS = new Set([
  ".next",
  ".turbo",
  "_generated",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);
const SHADCN_CONFIGS = [
  "apps/www/components.json",
  "packages/design-system/components.json",
] as const;
const EXTENSION_PATTERN = /\.d\.ts$|\.[^.]+$/u;
const FINAL_TEST_PATTERN = /\.test\.ts$/u;
const RUNNABLE_TEST_PATTERN = /\.test\.tsx?$/u;
const JAVASCRIPT_PATTERN = /\.(?:c|m)?js$/u;
const WORD_SEPARATOR_PATTERN = /[._-]+/u;

class QualityError extends Schema.TaggedError<QualityError>()("QualityError", {
  violations: Schema.Array(Schema.String),
}) {}

/** Determines whether a filesystem entry belongs to generated or external code. */
function isSkipped(filePath: string) {
  return filePath.split(path.sep).some((part) => SKIPPED_PARTS.has(part));
}

/** Converts an absolute repository file path to a stable policy path. */
function repositoryPath(filePath: string) {
  return path.relative(process.cwd(), filePath);
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

/** Returns module specifiers used by static and dynamic imports. */
function moduleSpecifiers(filePath: string, source: string) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const modules: string[] = [];

  /** Visits imports while preserving their exact string specifier. */
  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      modules.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      modules.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return modules;
}

/** Enforces alias imports and approved test and UI dependencies. */
function moduleViolations(filePath: string, source: string) {
  if (filePath.endsWith(".d.ts")) {
    return [];
  }
  const modules = moduleSpecifiers(filePath, source);
  const relative = modules
    .filter((specifier) => specifier.startsWith("."))
    .map((specifier) => `${filePath} uses relative import ${specifier}`);
  const rawVitest =
    FINAL_TEST_PATTERN.test(filePath) && modules.includes("vitest")
      ? [`${filePath} must import test APIs from @effect/vitest`]
      : [];
  const radix = modules
    .filter(
      (specifier) =>
        specifier === "radix-ui" || specifier.startsWith("@radix-ui/")
    )
    .map((specifier) => `${filePath} imports forbidden ${specifier}`);
  return [...relative, ...rawVitest, ...radix];
}

/** Enforces TypeScript ownership for tests and framework-only JavaScript. */
function pathViolations(files: readonly string[]) {
  const repositoryFiles = new Set(files.map(repositoryPath));
  return files.flatMap((filePath) => {
    const relativePath = repositoryPath(filePath);
    const javascript = JAVASCRIPT_PATTERN.test(relativePath)
      ? [`${relativePath} is hand-written JavaScript`]
      : [];
    const invalidTest =
      RUNNABLE_TEST_PATTERN.test(relativePath) &&
      !FINAL_TEST_PATTERN.test(relativePath)
        ? [`${relativePath} must use the final .test.ts convention`]
        : [];
    const owner = relativePath.replace(FINAL_TEST_PATTERN, ".ts");
    const orphan =
      FINAL_TEST_PATTERN.test(relativePath) && !repositoryFiles.has(owner)
        ? [`${relativePath} has no colocated ${owner} owner`]
        : [];
    return [...javascript, ...invalidTest, ...orphan];
  });
}

/** Verifies that every Shadcn workspace selects Base Nova and Hugeicons. */
function shadcnConfigViolations(configPath: string, source: string) {
  return source.includes('"style": "base-nova"') &&
    source.includes('"iconLibrary": "hugeicons"')
    ? []
    : [`${configPath} must use Shadcn base-nova with Hugeicons`];
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
  const sourceChecks = (yield* Effect.forEach(
    files,
    (filePath) =>
      Effect.tryPromise({
        catch: () =>
          new QualityError({ violations: [`Cannot read ${filePath}`] }),
        try: () => readFile(filePath, "utf8"),
      }).pipe(
        Effect.map((source) => [
          ...jsDocViolations(filePath, source),
          ...moduleViolations(repositoryPath(filePath), source),
        ])
      ),
    { concurrency: "unbounded" }
  )).flat();
  const shadcn = (yield* Effect.forEach(
    SHADCN_CONFIGS,
    (configPath) =>
      Effect.tryPromise({
        catch: () =>
          new QualityError({ violations: [`Cannot read ${configPath}`] }),
        try: () => readFile(path.resolve(configPath), "utf8"),
      }).pipe(
        Effect.map((source) => shadcnConfigViolations(configPath, source))
      ),
    { concurrency: "unbounded" }
  )).flat();
  const violations = [
    ...naming,
    ...pathViolations(files),
    ...sourceChecks,
    ...shadcn,
  ];
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
