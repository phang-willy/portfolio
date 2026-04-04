/**
 * `output: "export"` est incompatible avec les Route Handlers (`app/api`).
 * Pour garder le code API en TS dans le repo tout en produisant `out/`,
 * on déplace temporairement `src/app/api` pendant `next build`.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");
const stashDir = path.join(root, ".tmp", "stashed-app-api");

function stash() {
  if (!fs.existsSync(apiDir)) return false;
  fs.rmSync(stashDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(stashDir), { recursive: true });
  fs.renameSync(apiDir, stashDir);
  return true;
}

function unstash() {
  if (!fs.existsSync(stashDir)) return;
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(apiDir), { recursive: true });
  fs.renameSync(stashDir, apiDir);
}

const didStash = stash();
try {
  execSync("next build", { stdio: "inherit", cwd: root, env: { ...process.env } });
} finally {
  if (didStash) unstash();
}
