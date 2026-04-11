import type { NextConfig } from "next";
import { env } from "process";

const allowedDevOrigins = (env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
  /** Redimensionnement Sharp ; le build prod utilise `next build --webpack` (package.json) pour `browserslist`. */
  images: {
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  reactCompiler: true,
  allowedDevOrigins: allowedDevOrigins,
  transpilePackages: ["maplibre-gl"],
  poweredByHeader: false,
};

export default nextConfig;
