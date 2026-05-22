import path from "node:path";
import type { NextConfig } from "next";

// Locally we set the project root explicitly so Next.js doesn't pick up
// unrelated lockfiles from parent OneDrive folders. On Vercel we leave it
// undefined — Vercel handles tracing itself, and passing paths can break
// `modifyConfig`.
const isVercel = !!process.env.VERCEL;
const projectRoot = isVercel ? undefined : path.resolve(process.cwd());

const nextConfig: NextConfig = {
  ...(projectRoot
    ? {
        outputFileTracingRoot: projectRoot,
        turbopack: { root: projectRoot },
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
