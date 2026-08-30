import agentmail from "@agentmail/convex/convex.config";
import agent from "@convex-dev/agent/convex.config";
import auth from "@convex-dev/auth/core/convex.config";
import password from "@convex-dev/auth/providers/password/convex.config";
import username from "@convex-dev/auth/username/convex.config";
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
    AUTH_JWKS: v.string(),
    AUTH_PRIVATE_KEY: v.string(),
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});

app.use(agent);
app.use(auth, {
  env: {
    AUTH_JWKS: app.env.AUTH_JWKS,
    AUTH_PRIVATE_KEY: app.env.AUTH_PRIVATE_KEY,
  },
  httpPrefix: "/auth",
});
app.use(agentmail, {
  env: {
    AGENTMAIL_API_KEY: app.env.AGENTMAIL_API_KEY,
    AGENTMAIL_BASE_URL: app.env.AGENTMAIL_BASE_URL,
    AGENTMAIL_WEBHOOK_SECRET: app.env.AGENTMAIL_WEBHOOK_SECRET,
  },
});
app.use(password);
app.use(rateLimiter);
app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
  },
});
app.use(staticHosting);
app.use(username);

export default app;
