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
      // Limite do corpo da requisição (500MB em bytes)
      // Essencial para upload de ZIPs grandes
      bodySizeLimit: 524288000, 
    },
  },
  images: {
    remotePatterns: [
      { hostname: "*" }
    ]
  }
};

export default nextConfig;