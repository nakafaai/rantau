import { Effect, Schema } from "effect";

const InboxResponse = Schema.Struct({
  email: Schema.String,
  inbox_id: Schema.String,
});

export class MailProvisionError extends Schema.TaggedError<MailProvisionError>()(
  "MailProvisionError",
  { message: Schema.String }
) {}

/** Validates the untrusted inbox record returned by AgentMail. */
export const decodeInbox = Effect.fn("mail.decodeInbox")(function* (
  input: unknown
) {
  return yield* Schema.decodeUnknownEffect(InboxResponse)(input).pipe(
    Effect.mapError(
      () =>
        new MailProvisionError({
          message: "AgentMail returned an unreadable inbox record.",
        })
    )
  );
});
