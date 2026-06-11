import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js this directory is the project root (avoids picking up
  // unrelated lockfiles in parent OneDrive folders).
  outputFileTracingRoot: path.join(__dirname),
  // pdfkit needs its AFM font metrics from node_modules — do not bundle.
  serverExternalPackages: ["pdfkit", "dejavu-fonts-ttf"],
  outputFileTracingIncludes: {
    "/api/admin/orders/[id]/send-invoice": [
      "./node_modules/dejavu-fonts-ttf/ttf/*.ttf",
      "./node_modules/pdfkit/js/data/*.afm",
    ],
  },
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
