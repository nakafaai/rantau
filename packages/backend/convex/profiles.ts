import {
  internalMutation,
  mutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { profileInputValidator } from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import type { ProfileInput as Profile } from "@repo/domain/profile";
import { ProfileInput } from "@repo/domain/profile";
import { ConvexError, v } from "convex/values";
import { Effect, Schema } from "effect";

const MAX_CV_BYTES = 5 * 1024 * 1024;

/** Copies readonly Effect-decoded profile values into Convex-owned arrays. */
function storedProfile(profile: Profile) {
  return {
    ...profile,
    desiredLocations: [...profile.desiredLocations],
    desiredRoles: [...profile.desiredRoles],
    documents: [...profile.documents],
    education: [...profile.education],
    languages: profile.languages.map((language) => ({ ...language })),
    licenses: [...profile.licenses],
    pathways: [...profile.pathways],
    skills: [...profile.skills],
    workModes: [...profile.workModes],
  };
}

/** Loads the current authenticated candidate profile. */
export const get = query({
  args: {},
  returns: v.union(schema.doc("profiles"), v.null()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .unique();
  },
});

/** Validates and upserts one profile for the current authenticated user. */
export const upsert = mutation({
  args: profileInputValidator.fields,
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const validation = await Effect.runPromise(
      Schema.decodeUnknownEffect(ProfileInput)(args).pipe(
        Effect.match({
          onFailure: () => ({ success: false }) as const,
          onSuccess: (decoded) => ({ decoded, success: true }) as const,
        })
      )
    );
    if (!validation.success) {
      throw new ConvexError({ code: "INVALID_PROFILE" });
    }
    const profile = storedProfile(validation.decoded);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch("profiles", existing._id, {
        ...profile,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      ...profile,
      updatedAt: Date.now(),
      userId,
    });
  },
});

/** Creates a short-lived upload URL for an authenticated CV intake. */
export const uploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Persists a validated CV while preventing storage reuse across profiles. */
export const saveCv = internalMutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    text: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const metadata = await ctx.db.system.get("_storage", args.fileId);
    if (
      metadata?.contentType !== "application/pdf" ||
      metadata.size > MAX_CV_BYTES
    ) {
      throw new ConvexError({ code: "INVALID_CV" });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", args.userId))
      .unique();
    if (!profile) {
      throw new ConvexError({ code: "PROFILE_REQUIRED" });
    }

    const existingOwner = await ctx.db
      .query("profiles")
      .withIndex("by_cv", (index) => index.eq("cvStorageId", args.fileId))
      .unique();
    if (existingOwner && existingOwner.userId !== args.userId) {
      throw new ConvexError({ code: "CV_ALREADY_OWNED" });
    }

    await ctx.db.patch("profiles", profile._id, {
      cvFileName: args.fileName.slice(0, 160),
      cvStorageId: args.fileId,
      cvText: args.text,
      updatedAt: Date.now(),
    });
    if (profile.cvStorageId && profile.cvStorageId !== args.fileId) {
      await ctx.storage.delete(profile.cvStorageId);
    }
    return null;
  },
});

/** Deletes an orphaned CV upload while preserving every referenced file. */
export const discardCv = internalMutation({
  args: { fileId: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const owner = await ctx.db
      .query("profiles")
      .withIndex("by_cv", (index) => index.eq("cvStorageId", args.fileId))
      .unique();
    if (!owner) {
      await ctx.storage.delete(args.fileId);
    }
    return null;
  },
});
