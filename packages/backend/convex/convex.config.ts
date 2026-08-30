import agentmail from "@agentmail/convex/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    AGENTMAIL_API_KEY: v.string(),
    AGENTMAIL_BASE_URL: v.optional(v.string()),
    AGENTMAIL_WEBHOOK_SECRET: v.optional(v.string()),
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});

app.use(agent);
app.use(agentmail, {
  env: {
    AGENTMAIL_API_KEY: app.env.AGENTMAIL_API_KEY,
    AGENTMAIL_BASE_URL: app.env.AGENTMAIL_BASE_URL,
    AGENTMAIL_WEBHOOK_SECRET: app.env.AGENTMAIL_WEBHOOK_SECRET,
  },
});
app.use(rateLimiter);
app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
  },
});
app.use(staticHosting);

export default app;
