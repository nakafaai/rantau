"use client";

import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { useMutation } from "convex/react";

/** Marks one saved opportunity in every active realtime results query. */
function markSaved(
  store: OptimisticLocalStore,
  opportunityIds: ReadonlySet<Id<"opportunities">>
) {
  for (const query of store.getAllQueries(api.opportunities.list)) {
    if (!query.value) {
      continue;
    }
    store.setQuery(
      api.opportunities.list,
      query.args,
      query.value.map((record) =>
        opportunityIds.has(record.opportunity._id)
          ? { ...record, isSaved: true }
          : record
      )
    );
  }
}

/** Returns the application save mutation with immediate local feedback. */
export function useSaveApplication() {
  return useMutation(api.applications.save).withOptimisticUpdate(
    (store, args) => markSaved(store, new Set([args.opportunityId]))
  );
}

/** Returns the bulk save mutation with immediate local feedback. */
export function useSaveApplications() {
  return useMutation(api.applications.saveMany).withOptimisticUpdate(
    (store, args) => markSaved(store, new Set(args.opportunityIds))
  );
}

/** Returns the status transition mutation with an optimistic tracker row. */
export function useTransitionApplication() {
  return useMutation(api.applications.transition).withOptimisticUpdate(
    (store, args) => {
      const records = store.getQuery(api.applications.list, {});
      if (!records) {
        return;
      }
      store.setQuery(
        api.applications.list,
        {},
        records
          .map((record) => {
            if (record.application._id !== args.applicationId) {
              return record;
            }
            return {
              ...record,
              application: {
                ...record.application,
                appliedAt:
                  args.status === "applied"
                    ? args.requestedAt
                    : record.application.appliedAt,
                notes: args.notes ?? record.application.notes,
                status: args.status,
                updatedAt: args.requestedAt,
              },
            };
          })
          .sort(
            (left, right) =>
              right.application.updatedAt - left.application.updatedAt
          )
      );
    }
  );
}
