"use client";

import type { SidebarStatePersistenceError } from "@repo/design-system/lib/sidebar/persistence";
import { Effect } from "effect";

/** Runs sidebar persistence at the React boundary without blocking navigation. */
export function runSidebarStateProgram(
  program: Effect.Effect<void, SidebarStatePersistenceError>
) {
  Effect.runSync(
    program.pipe(
      Effect.catchTag("SidebarStatePersistenceError", () =>
        Effect.succeed(undefined)
      )
    )
  );
}
