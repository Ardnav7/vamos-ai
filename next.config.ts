import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expo app lives in /mobile — never typecheck it during `next build` (Vercel).
  typescript: {
    tsconfigPath: "tsconfig.web.json",
  },
};

export default nextConfig;
