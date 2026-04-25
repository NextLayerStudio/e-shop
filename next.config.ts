import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js this directory is the project root (avoids picking up
  // unrelated lockfiles in parent OneDrive folders).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
