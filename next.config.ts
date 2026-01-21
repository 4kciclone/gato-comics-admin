import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Origens permitidas para evitar erro de CORS/Origin
      allowedOrigins: [
        "admin.gatocomics.com.br", 
        "gatocomics.local:3000", 
        "localhost:3000"
      ],
      // Limite menor para Server Actions (não será mais usado para uploads)
      bodySizeLimit: 10485760, // 10MB
    },
  },
  
  images: {
    remotePatterns: [
      { hostname: "*" }
    ]
  },
};

export default nextConfig;