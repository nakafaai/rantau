import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@repo/design-system", "@repo/domain"],
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
