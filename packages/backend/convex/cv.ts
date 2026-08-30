"use node";

import { internal } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { type ActionCtx, action } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const MAX_CV_TEXT = 40_000;

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
  ctx: ActionCtx,
  fileId: Id<"_storage">
) {
  yield* Effect.tryPromise({
    catch: (cause) => cause,
    try: () => ctx.runMutation(internal.profiles.discardCv, { fileId }),
  }).pipe(Effect.ignore);
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
      Effect.gen(function* () {
        const blob = yield* Effect.tryPromise({
          catch: () => ({
            code: "CV_INTAKE_FAILED" as const,
            message: "The uploaded CV could not be read.",
          }),
          try: () => ctx.storage.get(args.fileId),
        });
        if (
          blob?.type !== "application/pdf" ||
          blob.size > MAX_CV_BYTES ||
          args.fileName.trim().length === 0
        ) {
          return yield* Effect.fail({
            code: "PDF_REQUIRED" as const,
            message: "A valid PDF CV is required.",
          });
        }

        const text = yield* extractPdfText(blob).pipe(
          Effect.mapError(() => ({
            code: "CV_INTAKE_FAILED" as const,
            message: "The uploaded CV could not be extracted.",
          }))
        );
        yield* Effect.tryPromise({
          catch: () => ({
            code: "CV_INTAKE_FAILED" as const,
            message: "The uploaded CV could not be attached.",
          }),
          try: () =>
            ctx.runMutation(internal.profiles.saveCv, {
              fileId: args.fileId,
              fileName: args.fileName,
              text,
              userId,
            }),
        });
        return text.length;
      }).pipe(
        Effect.tapError(() => discardUpload(ctx, args.fileId)),
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
