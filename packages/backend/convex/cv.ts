"use node";

import { internal } from "@repo/backend/convex/_generated/api";
import { action } from "@repo/backend/convex/_generated/server";
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

export const extract = action({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.object({ characters: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const blob = await ctx.storage.get(args.fileId);
    if (
      blob?.type !== "application/pdf" ||
      blob.size > MAX_CV_BYTES ||
      args.fileName.trim().length === 0
    ) {
      throw new ConvexError({ code: "PDF_REQUIRED" });
    }

    const outcome = await Effect.runPromise(
      extractPdfText(blob).pipe(
        Effect.match({
          onFailure: (error) => ({ error, success: false }) as const,
          onSuccess: (text) => ({ success: true, text }) as const,
        })
      )
    );
    if (!outcome.success) {
      throw new ConvexError({
        code: "CV_EXTRACTION_FAILED",
        message: String(outcome.error),
      });
    }

    await ctx.runMutation(internal.profiles.saveCv, {
      fileId: args.fileId,
      fileName: args.fileName,
      text: outcome.text,
      userId,
    });
    return { characters: outcome.text.length };
  },
});
