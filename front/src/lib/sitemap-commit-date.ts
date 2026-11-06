import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Date du dernier commit. Git si le dépôt est là, sinon `SITEMAP_COMMIT_DATE`
 * (image Docker, quand le contexte de build n'a pas `.git`).
 */
export function readLastCommitDate(cwd = process.cwd()): Date | undefined {
  const fromEnv = parseCommitInstant(process.env.SITEMAP_COMMIT_DATE);
  if (fromEnv) return fromEnv;

  const gitDir = process.env.GIT_DIR?.trim();
  if (gitDir) {
    const fromGitDir = readGitCommit(undefined, gitDir);
    if (fromGitDir) return fromGitDir;
  }

  const root = findGitRoot(cwd);
  if (!root) return undefined;
  return readGitCommit(root);
}

function readGitCommit(cwd?: string, gitDir?: string): Date | undefined {
  try {
    const args = [
      "-c",
      "safe.directory=*",
      ...(gitDir ? ["--git-dir", gitDir] : []),
      "log",
      "-1",
      "--format=%cI",
    ];
    const output = execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return parseCommitInstant(output);
  } catch {
    return undefined;
  }
}

function findGitRoot(start: string): string | undefined {
  let current = path.resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return undefined;
}

function parseCommitInstant(value: string | undefined): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const instant = new Date(trimmed);
  return Number.isNaN(instant.getTime()) ? undefined : instant;
}
