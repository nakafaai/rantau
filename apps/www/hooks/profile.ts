"use client";

import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";

type ProfileMutation = FunctionArgs<typeof api.profiles.upsert>;

/** Projects an authenticated user id into the temporary optimistic id seam. */
function optimisticProfileId(userId: Id<"users">) {
  return userId as unknown as Id<"profiles">;
}

/** Returns the profile upsert mutation with an immediate realtime projection. */
export function useSaveProfile(userId: Id<"users"> | undefined) {
  return useMutation(api.profiles.upsert).withOptimisticUpdate(
    (store, args: ProfileMutation) => {
      if (!userId) {
        return;
      }
      const current = store.getQuery(api.profiles.get, {});
      store.setQuery(
        api.profiles.get,
        {},
        {
          ...(current ?? {
            _creationTime: 0,
            _id: optimisticProfileId(userId),
            userId,
          }),
          ...args,
          updatedAt: current?.updatedAt ?? 0,
        }
      );
    }
  );
}
