import { env } from "@repo/backend/convex/_generated/server";

export default {
  providers: [
    {
      applicationID: "convex",
      domain: env.CONVEX_SITE_URL,
    },
  ],
};
