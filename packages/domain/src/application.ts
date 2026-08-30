import { Effect, Schema } from "effect";

export const ApplicationStatus = Schema.Literals([
  "saved",
  "applied",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
]);
export type ApplicationStatus = Schema.Schema.Type<typeof ApplicationStatus>;

export class ApplicationTransitionError extends Schema.TaggedError<ApplicationTransitionError>()(
  "ApplicationTransitionError",
  {
    from: ApplicationStatus,
    to: ApplicationStatus,
  }
) {}

const allowedTransitions = {
  saved: ["applied", "withdrawn"],
  applied: ["interview", "offer", "rejected", "withdrawn"],
  interview: ["offer", "rejected", "withdrawn"],
  offer: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: ["saved"],
  withdrawn: ["saved"],
} as const satisfies Record<ApplicationStatus, readonly ApplicationStatus[]>;

export const validateApplicationTransition = Effect.fn(
  "application.validateTransition"
)(function* (from: ApplicationStatus, to: ApplicationStatus) {
  const allowed: readonly ApplicationStatus[] = allowedTransitions[from];
  if (allowed.includes(to)) {
    return to;
  }

  return yield* Effect.fail(new ApplicationTransitionError({ from, to }));
});
