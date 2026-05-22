import path from "node:path";
import type { NextConfig } from "next";

// process.cwd() — safe on Vercel (ESM config has no __dirname)
const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  // Tell Next.js this directory is the project root (avoids picking up
  // unrelated lockfiles in parent OneDrive folders).
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
