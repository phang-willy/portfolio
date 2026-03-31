import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const mode = process.argv[2];
if (!mode) {
  console.error("Usage: node scripts/next-with-server-port.mjs <dev|start> [args...]");
  process.exit(1);
}

const loadEnvFile = (fileName) => {
  const envPath = path.join(process.cwd(), fileName);
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      // Remove surrounding quotes: KEY="value" or KEY='value'
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // Ignore missing/unreadable env files.
  }
};

// Load runtime env in priority order:
// 1) .env (project local values)
// 2) .env.exemple (fallback defaults, including comma-separated ALLOWED_DEV_ORIGINS)
loadEnvFile(".env");
loadEnvFile(".env.exemple");

const port =
  process.env.SERVER_PORT ??
  process.env.PORT ??
  "3000";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const child = spawn(
  process.execPath,
  [nextBin, mode, "-H", "0.0.0.0", "-p", port, ...process.argv.slice(3)],
  {
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

