import type { NextConfig } from "next";
import { env } from "process";

const defaultAllowedDevOrigins = ["localhost", "127.0.0.1"];

const configuredAllowedDevOrigins = (env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const allowedDevOrigins = Array.from(
  new Set([...defaultAllowedDevOrigins, ...configuredAllowedDevOrigins]),
);

const contactApiOrigin = (() => {
  const value = (env.NEXT_PUBLIC_CONTACT_API_ORIGIN ?? "").trim();

  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
})();

const connectSources = [
  "'self'",
  "https://api.github.com",
  "https://a.basemaps.cartocdn.com",
  "https://b.basemaps.cartocdn.com",
  "https://c.basemaps.cartocdn.com",
  ...(contactApiOrigin ? [contactApiOrigin] : []),
].join(" ");

/**
 * CSP production : Next (scripts inline, hydration), Tailwind, MapLibre (worker blob,
 * WebGL), next/font (fonts.gstatic.com), tuiles Carto, images HTTPS (projets, tuiles).
 * Pas d’activation en dev : hot reload et eval.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src ${connectSources}`,
  "worker-src 'self' blob:",
].join("; ");

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
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  /** Redimensionnement Sharp ; le build prod utilise le bundler par défaut de Next. */
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
