/** Aligné sur PROJECTS_REVALIDATE_SECONDS dans projects.ts */
const GITHUB_REPO_CACHE_SECONDS = 300;

export type ProjectLinksLike = {
  github?: string;
  url?: string;
};

export function parseGithubRepoFromUrl(
  url: string | undefined,
): { owner: string; repo: string } | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.toLowerCase() !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/i, "") ?? "";
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

/** Préfère `github`, sinon `url` si c’est une URL de dépôt github.com */
export function resolveGithubRepoUrl(
  links: ProjectLinksLike,
): string | undefined {
  const gh = links.github?.trim();
  if (gh) return gh;
  const u = links.url?.trim();
  if (u && parseGithubRepoFromUrl(u)) return u;
  return undefined;
}

function githubTimestampToIsoDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function githubFetchInit(): RequestInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return {
    next: { revalidate: GITHUB_REPO_CACHE_SECONDS },
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

/**
 * Ordre pour `updatedAt` (1er commit trouvé gagne) :
 * 1. main, master, branche par défaut GitHub (`default_branch`)
 * 2. dev, develop
 * Repli : `updated_at` du dépôt.
 */
function branchesForUpdatedAtPreference(
  defaultBranch: string | undefined,
): string[] {
  const ordered = [
    "main",
    "master",
    defaultBranch?.trim(),
    "dev",
    "develop",
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of ordered) {
    if (!b) continue;
    const key = b.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}

async function latestCommitIsoDateOnBranch(
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const commitsUrl = `${base}/commits?per_page=1&sha=${encodeURIComponent(branch)}`;
  try {
    const cres = await fetch(commitsUrl, githubFetchInit());
    if (!cres.ok) return null;
    const commits = (await cres.json()) as unknown;
    if (!Array.isArray(commits) || commits.length === 0) return null;
    const head = commits[0] as {
      commit?: {
        committer?: { date?: string };
        author?: { date?: string };
      };
    };
    const raw =
      head.commit?.committer?.date ?? head.commit?.author?.date;
    return raw ? githubTimestampToIsoDate(raw) : null;
  } catch {
    return null;
  }
}

/**
 * - createdAt : date de création du dépôt (API repo `created_at`)
 * - updatedAt : dernier commit selon `branchesForUpdatedAtPreference`, sinon `updated_at` du dépôt
 */
async function fetchGithubRepoDates(
  owner: string,
  repo: string,
): Promise<{ createdAt: string; updatedAt: string } | null> {
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  try {
    const res = await fetch(base, githubFetchInit());
    if (!res.ok) return null;
    const body = (await res.json()) as {
      created_at?: string;
      updated_at?: string;
      default_branch?: string;
    };
    const createdAt =
      body.created_at && githubTimestampToIsoDate(body.created_at);
    const updatedAtFallback =
      body.updated_at && githubTimestampToIsoDate(body.updated_at);
    if (!createdAt || !updatedAtFallback) return null;

    const candidates = branchesForUpdatedAtPreference(body.default_branch);

    for (const branch of candidates) {
      const iso = await latestCommitIsoDateOnBranch(owner, repo, branch);
      if (iso) return { createdAt, updatedAt: iso };
    }

    return { createdAt, updatedAt: updatedAtFallback };
  } catch {
    return null;
  }
}

export async function resolveProjectDatesFromGithub(
  links: ProjectLinksLike,
  fallback: { createdAt: string; updatedAt: string },
): Promise<{ createdAt: string; updatedAt: string }> {
  const ghUrl = resolveGithubRepoUrl(links);
  const parsed = ghUrl ? parseGithubRepoFromUrl(ghUrl) : null;
  if (!parsed) return fallback;
  const dates = await fetchGithubRepoDates(parsed.owner, parsed.repo);
  return dates ?? fallback;
}
