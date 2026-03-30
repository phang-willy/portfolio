import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const mode = process.argv[2];
if (!mode) {
  console.error("Usage: node scripts/next-with-server-port.mjs <dev|start> [args...]");
  process.exit(1);
}

// Load .env (simple parser) before reading SERVER_PORT.
// Next itself also loads .env for the spawned process, but we need the value now
// to pass the correct `-p` flag.
const envPath = path.join(process.cwd(), ".env");
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
  // No .env file (or unreadable) - fall back to defaults / existing env vars.
}

const port =
  process.env.SERVER_PORT ??
  process.env.PORT ??
  "3000";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, mode, "-p", port, ...process.argv.slice(3)], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

