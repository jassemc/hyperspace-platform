import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The generated lib/service files use relative imports with a `.js`
  // suffix (e.g. `./api.js`) per @hscowork/service-generator's default
  // `httpClientImport`; webpack's production build (unlike the Turbopack
  // dev server) needs this alias to resolve them to the actual `.ts` files.
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
};

export default nextConfig;
