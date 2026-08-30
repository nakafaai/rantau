"use node";

import { internal } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { action } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_CV_TEXT = 40_000;

type CvIntakePorts = Readonly<{
  attach: (input: {
    fileId: Id<"_storage">;
    fileName: string;
    text: string;
    userId: Id<"users">;
  }) => Promise<unknown>;
  discard: (fileId: Id<"_storage">) => Promise<unknown>;
  extractText: (blob: Blob) => Promise<string>;
  getFile: (fileId: Id<"_storage">) => Promise<Blob | null>;
}>;

type CvIntakeInput = Readonly<{
  fileId: Id<"_storage">;
  fileName: string;
  userId: Id<"users">;
}>;

/** Extracts normalized text from an uploaded PDF without exposing the file. */
const extractPdfText = Effect.fn("cv.extractPdfText")(function* (blob: Blob) {
  const buffer = yield* Effect.tryPromise(() => blob.arrayBuffer());
  const pdf = yield* Effect.tryPromise(() =>
    getDocumentProxy(new Uint8Array(buffer))
  );
  if (pdf.numPages > 20) {
    return yield* Effect.fail(new Error("CV must be 20 pages or fewer."));
  }

  const extracted = yield* Effect.tryPromise(() =>
    extractText(pdf, { mergePages: true })
  );
  return extracted.text.replaceAll(/\s+/g, " ").trim().slice(0, MAX_CV_TEXT);
});

/** Deletes an unreferenced upload without masking the original intake error. */
const discardUpload = Effect.fn("cv.discardUpload")(function* (
  discard: CvIntakePorts["discard"],
  fileId: Id<"_storage">
) {
  yield* Effect.tryPromise({
    catch: (cause) => cause,
    try: () => discard(fileId),
  }).pipe(Effect.ignore);
});

/** Runs the complete CV intake through explicit, testable storage ports. */
export const intakeCv = Effect.fn("cv.intake")(function* (
  ports: CvIntakePorts,
  input: CvIntakeInput
) {
  const intake = Effect.gen(function* () {
    const blob = yield* Effect.tryPromise({
      catch: () => ({
        code: "CV_INTAKE_FAILED" as const,
        message: "The uploaded CV could not be read.",
      }),
      try: () => ports.getFile(input.fileId),
    });
    if (
      blob?.type !== "application/pdf" ||
      blob.size > MAX_CV_BYTES ||
      input.fileName.trim().length === 0
    ) {
      return yield* Effect.fail({
        code: "PDF_REQUIRED" as const,
        message: "A valid PDF CV is required.",
      });
    }

    const text = yield* Effect.tryPromise({
      catch: () => ({
        code: "CV_INTAKE_FAILED" as const,
        message: "The uploaded CV could not be extracted.",
      }),
      try: () => ports.extractText(blob),
    });
    yield* Effect.tryPromise({
      catch: () => ({
        code: "CV_INTAKE_FAILED" as const,
        message: "The uploaded CV could not be attached.",
      }),
      try: () =>
        ports.attach({
          fileId: input.fileId,
          fileName: input.fileName,
          text,
          userId: input.userId,
        }),
    });
    return text.length;
  });

  return yield* intake.pipe(
    Effect.tapError(() => discardUpload(ports.discard, input.fileId))
  );
});

/** Validates, extracts, and atomically attaches one candidate-owned PDF CV. */
export const extract = action({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.object({ characters: v.number() }),
  handler: async (ctx, args): Promise<{ characters: number }> => {
    const userId = await requireUserId(ctx);
    const outcome = await Effect.runPromise(
      intakeCv(
        {
          attach: (input) => ctx.runMutation(internal.profiles.saveCv, input),
          discard: (fileId) =>
            ctx.runMutation(internal.profiles.discardCv, { fileId }),
          extractText: (blob) => Effect.runPromise(extractPdfText(blob)),
          getFile: (fileId) => ctx.storage.get(fileId),
        },
        { ...args, userId }
      ).pipe(
        Effect.match({
          onFailure: (error) => ({ error, success: false }) as const,
          onSuccess: (characters) => ({ characters, success: true }) as const,
        })
      )
    );
    if (!outcome.success) {
      throw new ConvexError(outcome.error);
    }

    return { characters: outcome.characters };
  },
});
