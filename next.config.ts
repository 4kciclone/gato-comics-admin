import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["gatocomics.local:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;