import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["gatocomics.local:3000", "localhost:3000"],
      bodySizeLimit: 524288000, 
    },
  },
};

export default nextConfig;