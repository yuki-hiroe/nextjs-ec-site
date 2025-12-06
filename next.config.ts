import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
    images: {
      unoptimized: true, // Vercelでの画像表示問題を解決するため、すべての画像を最適化しない
      remotePatterns: isDevelopment
        ? [
            // 開発環境: すべてのHTTPSドメインを許可
            {
              protocol: "https",
              hostname: "**",
            },
            {
              protocol: "http",
              hostname: "**",
            },
          ]
        : [
            // 本番環境: 特定のドメインのみ許可（セキュリティのため）
            {
              protocol: "https",
              hostname: "images.unsplash.com",
            },
            {
              protocol: "https",
              hostname: "store.storeimages.cdn-apple.com",
            },
            {
              protocol: "https",
              hostname: "encrypted-tbn0.gstatic.com",
            },
            {
              protocol: "https",
              hostname: "image.biccamera.com",
            },
            {
              protocol: "https",
              hostname: "www.apple.com",
            },
            {
              protocol: "https",
              hostname: "t3.ftcdn.net",
            },
            {
              protocol: "https",
              hostname: "t1.ftcdn.net",
            },
            {
              protocol: "https",
              hostname: "t2.ftcdn.net",
            },
            {
              protocol: "https",
              hostname: "t4.ftcdn.net",
            },
            {
              protocol: "https",
              hostname: "www.shipsltd.co.jp",
            },
            {
              protocol: "https",
              hostname: "www.uniqlo.com",
            },
          ],
    },
};

export default nextConfig;
