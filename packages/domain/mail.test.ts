import { describe, expect, it } from "@effect/vitest";
import { decodeInbox, makeInboxClientId } from "@repo/domain/mail";
import { Effect } from "effect";

describe("AgentMail boundaries", () => {
  it.effect("builds an AgentMail-safe idempotency key", () =>
    Effect.gen(function* () {
      const clientId = yield* makeInboxClientId("user_123");

      expect(clientId).toBe("rantau-user_123");
    })
  );

  it.effect("rejects an unsafe AgentMail idempotency key", () =>
    Effect.gen(function* () {
      const error = yield* makeInboxClientId("user:123").pipe(Effect.flip);

      expect(error._tag).toBe("MailProvisionError");
    })
  );

  it.effect("decodes a provisioned inbox", () =>
    Effect.gen(function* () {
      const inbox = yield* decodeInbox({
        email: "candidate@agentmail.to",
        inbox_id: "inbox_123",
      });

      expect(inbox.inbox_id).toBe("inbox_123");
    })
  );

  it.effect("rejects a malformed inbox", () =>
    Effect.gen(function* () {
      const error = yield* decodeInbox({ email: "missing-id" }).pipe(
        Effect.flip
      );

      expect(error._tag).toBe("MailProvisionError");
    })
  );
});
