import type { NextConfig } from "next";
import { env } from "process";

const allowedDevOrigins = (env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: allowedDevOrigins,
  transpilePackages: ["maplibre-gl"],
};

export default nextConfig;
