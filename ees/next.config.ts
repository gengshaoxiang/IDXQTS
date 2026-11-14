import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // cursor/identity.ts imports ./identity.dev.js; map to the .ts sibling for Turbopack.
  turbopack: {
    resolveAlias: {
      [path.resolve(__dirname, "cursor/identity.dev.js")]: path.resolve(
        __dirname,
        "cursor/identity.dev.ts",
      ),
    },
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
