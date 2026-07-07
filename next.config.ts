import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["kreator.englishbooster.id"],

  // Mark native/addon packages so Next.js doesn't try to bundle them with Turbopack
  serverExternalPackages: ["@napi-rs/canvas"],

  // Next.js 16: Turbopack configuration (promoted from experimental)
  turbopack: {
    // Enable filesystem caching for faster restarts
    // experimental: { turbopackFileSystemCacheForDev: true },
  },

  // Next.js 16: Stable React Compiler for automatic memoization
  reactCompiler: true,

  // Next.js 16: Optimize heavy client-side packages
  // Only the used export trees are bundled per page, reducing client JS
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "date-fns",
      "date-fns/locale",
      "zod",
      "@tanstack/react-query",
      "@tanstack/react-table",
    ],
  },
};

export default nextConfig;
