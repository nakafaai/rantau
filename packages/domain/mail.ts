import { Effect, Schema } from "effect";

const InboxResponse = Schema.Struct({
  email: Schema.String,
  inbox_id: Schema.String,
});

const ClientId = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9._~-]+$/u));

export class MailProvisionError extends Schema.TaggedError<MailProvisionError>()(
  "MailProvisionError",
  { message: Schema.String }
) {}

/** Builds the provider-safe idempotency key for one Rantau user. */
export const makeInboxClientId = Effect.fn("mail.makeInboxClientId")(function* (
  userId: string
) {
  return yield* Schema.decodeUnknownEffect(ClientId)(`rantau-${userId}`).pipe(
    Effect.mapError(
      () =>
        new MailProvisionError({
          message: "The AgentMail client identifier is invalid.",
        })
    )
  );
});

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
