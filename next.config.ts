import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
    images: {
      unoptimized: true, // Vercelでの画像表示問題を解決するため、すべての画像を最適化しない
      // unoptimized: trueの場合、remotePatternsの制限は適用されないが、
      // 念のためすべてのHTTPS/HTTPドメインを許可
      remotePatterns: [
        {
          protocol: "https",
          hostname: "**",
        },
        {
          protocol: "http",
          hostname: "**",
        },
      ],
    },
};

export default nextConfig;
