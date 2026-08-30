import { AgentMail } from "@agentmail/convex";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "@repo/backend/convex/_generated/api";
import {
  type ActionCtx,
  httpAction,
} from "@repo/backend/convex/_generated/server";
import { auth } from "@repo/backend/convex/auth";
import { httpRouter } from "convex/server";

const http = httpRouter();
const agentmail = new AgentMail(components.agentmail);

/** Adapts the current Convex action context to AgentMail's mutation surface. */
function webhookContext(
  ctx: ActionCtx
): Parameters<AgentMail["handleWebhook"]>[0] {
  return {
    runMutation: (mutation, ...args) => ctx.runMutation(mutation, args[0]),
  };
}

auth.addHttpRoutes(http);

http.route({
  handler: httpAction((ctx, request) =>
    agentmail.handleWebhook(webhookContext(ctx), request)
  ),
  method: "POST",
  path: "/agentmail/webhook",
});

registerStaticRoutes(http, components.staticHosting);

export default http;
