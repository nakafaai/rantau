import { AgentMail } from "@agentmail/convex";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "@repo/backend/convex/_generated/api";
import {
  type ActionCtx,
  httpAction,
} from "@repo/backend/convex/_generated/server";
import { registerPageRoutes } from "@repo/backend/convex/hosting";
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

http.route({
  handler: httpAction((ctx, request) =>
    agentmail.handleWebhook(webhookContext(ctx), request)
  ),
  method: "POST",
  path: "/agentmail/webhook",
});

registerPageRoutes(http);
registerStaticRoutes(http, components.staticHosting);

export default http;
