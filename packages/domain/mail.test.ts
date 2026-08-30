import { describe, expect, it } from "@effect/vitest";
import { decodeInbox } from "@repo/domain/mail";
import { Effect } from "effect";

describe("AgentMail boundaries", () => {
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
