import { env } from "@repo/backend/convex/_generated/server";
import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      applicationID: "convex",
      algorithm: "RS256",
      issuer: env.CONVEX_SITE_URL,
      jwks: `${env.CONVEX_SITE_URL}/auth/.well-known/jwks.json`,
      type: "customJwt",
    },
  ],
} satisfies AuthConfig;
