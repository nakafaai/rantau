import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: { unoptimized: true },
  output: "export",
  reactCompiler: true,
  trailingSlash: true,
  transpilePackages: ["@repo/design-system", "@repo/domain"],
};

export default nextConfig;
