import { getAuthUserId } from "@convex-dev/auth/core";
import type { DataModel } from "@repo/backend/convex/_generated/dataModel";
import type {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { ConvexError } from "convex/values";

type AuthContext =
  | GenericActionCtx<DataModel>
  | GenericMutationCtx<DataModel>
  | GenericQueryCtx<DataModel>;

/** Resolves the signed-in app user at a Convex framework boundary. */
export async function requireUserId(ctx: AuthContext) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHENTICATED" });
  }
  return userId;
}
