import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  images: { unoptimized: true },
  output: "export",
  reactCompiler: true,
  trailingSlash: true,
  transpilePackages: ["@repo/design-system", "@repo/domain"],
};

export default nextConfig;
