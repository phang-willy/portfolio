import { unstable_noStore as noStore } from "next/cache";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const isDev = process.env.NODE_ENV === "development";

/** En prod / export statique : pas de noStore pour permettre le prérendu au build. */
function noStoreIfDev(): void {
  if (isDev) noStore();
}

export type GithubStats = {
  contributionsAllTime: number;
  repositoriesAffiliated: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

function utcTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addUtcDays(isoDate: string, deltaDays: number): string {
  const ms = Date.parse(`${isoDate}T12:00:00.000Z`) + deltaDays * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Jours avec au moins une contribution, à partir du calendrier agrégé. */
function activeContributionDays(dayTotals: Map<string, number>): Set<string> {
  const active = new Set<string>();
  for (const [date, count] of dayTotals) {
    if (count > 0) active.add(date);
  }
  return active;
}

function longestStreakDaysFromActive(active: Set<string>): number {
  const sorted = [...active].sort();
  if (sorted.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev && cur && cur === addUtcDays(prev, 1)) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Série en cours (UTC) : si le jour courant n’a pas encore de contribution,
 * on peut encore prolonger la série depuis hier (comportement proche du graphe GitHub).
 */
function currentStreakDaysFromActive(active: Set<string>): number {
  const today = utcTodayIsoDate();
  let d = active.has(today) ? today : addUtcDays(today, -1);
  let streak = 0;
  while (active.has(d)) {
    streak++;
    d = addUtcDays(d, -1);
  }
  return streak;
}

function mergeContributionCalendarDays(
  into: Map<string, number>,
  weeks:
    | Array<{
        contributionDays?: Array<{
          date?: string;
          contributionCount?: number;
        }>;
      }>
    | undefined,
): void {
  for (const week of weeks ?? []) {
    for (const day of week.contributionDays ?? []) {
      const date = day.date;
      if (!date) continue;
      const count = day.contributionCount ?? 0;
      into.set(date, (into.get(date) ?? 0) + count);
    }
  }
}

function isExplicitDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Fenêtres d’au plus ~1 an : l’API GitHub refuse un intervalle plus long sur `contributionsCollection`. */
function contributionYearChunks(
  createdAt: Date,
  until: Date,
): Array<{ from: string; to: string }> {
  const chunks: Array<{ from: string; to: string }> = [];
  const startY = createdAt.getUTCFullYear();
  const endY = until.getUTCFullYear();

  for (let y = startY; y <= endY; y++) {
    const from =
      y === startY ? createdAt : new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
    const to =
      y === endY ? until : new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
    if (from.getTime() > to.getTime()) continue;
    chunks.push({ from: from.toISOString(), to: to.toISOString() });
  }
  return chunks;
}

async function githubGraphql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<
  { ok: true; data: T } | { ok: false; errors?: string; http?: string }
> {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: isDev ? "no-store" : "force-cache",
  });

  if (!response.ok) {
    return { ok: false, http: `${response.status} ${response.statusText}` };
  }

  const responsePayload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (responsePayload.errors?.length) {
    return {
      ok: false,
      errors: responsePayload.errors
        .map((graphqlError) => graphqlError.message ?? "?")
        .join(" | "),
    };
  }

  if (responsePayload.data === undefined || responsePayload.data === null) {
    return { ok: false, errors: "réponse sans data" };
  }

  return { ok: true, data: responsePayload.data };
}

export async function getGithubStats(): Promise<GithubStats | null> {
  noStoreIfDev();

  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;

  type BaseData = {
    viewer?: {
      login?: string;
      createdAt?: string;
      repositories?: { totalCount?: number };
    } | null;
  };

  const baseQuery = /* GraphQL */ `
    query GithubStatsBase {
      viewer {
        login
        createdAt
        repositories(ownerAffiliations: [OWNER, COLLABORATOR], first: 1) {
          totalCount
        }
      }
    }
  `;

  const baseStatsResponse = await githubGraphql<BaseData>(token, baseQuery);
  if (!baseStatsResponse.ok) {
    if (isExplicitDev()) {
      console.error(
        "[github] getGithubStats — requête de base échouée :",
        baseStatsResponse.http ?? baseStatsResponse.errors,
      );
    }
    return null;
  }

  const viewer = baseStatsResponse.data.viewer;
  const login = viewer?.login;
  if (!login) {
    if (isExplicitDev()) {
      console.error("[github] getGithubStats — viewer.login absent.");
    }
    return null;
  }

  const expected = process.env.GITHUB_USERNAME?.trim().toLowerCase();
  if (expected && login.toLowerCase() !== expected) {
    if (isExplicitDev()) {
      console.warn(
        `[github] getGithubStats — login API "${login}" ≠ GITHUB_USERNAME "${expected}".`,
      );
    }
    return null;
  }

  const createdAtRaw = viewer?.createdAt;
  const createdAt = createdAtRaw
    ? new Date(createdAtRaw)
    : new Date(Date.UTC(2008, 0, 1));
  if (Number.isNaN(createdAt.getTime())) {
    if (isExplicitDev()) {
      console.error("[github] getGithubStats — createdAt invalide.");
    }
    return null;
  }

  const until = new Date();
  const contributionDateRanges = contributionYearChunks(createdAt, until);

  const chunkQuery = /* GraphQL */ `
    query GithubContributionsChunk($from: DateTime!, $to: DateTime!) {
      viewer {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  type ContributionsChunkData = {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: number;
          weeks?: Array<{
            contributionDays?: Array<{
              date?: string;
              contributionCount?: number;
            }>;
          }>;
        };
      };
    } | null;
  };

  const contributionChunkResponses = await Promise.all(
    contributionDateRanges.map((dateRange) =>
      githubGraphql<ContributionsChunkData>(token, chunkQuery, dateRange),
    ),
  );

  const contributionsByDay = new Map<string, number>();
  let contributionsAllTime = 0;
  for (let i = 0; i < contributionChunkResponses.length; i++) {
    const chunkResponse = contributionChunkResponses[i];
    if (!chunkResponse.ok) {
      if (isExplicitDev()) {
        console.error(
          `[github] getGithubStats — chunk ${contributionDateRanges[i]?.from.slice(0, 10)}… :`,
          chunkResponse.http ?? chunkResponse.errors,
        );
      }
      return null;
    }
    const calendar =
      chunkResponse.data.viewer?.contributionsCollection?.contributionCalendar;
    const contributionsForChunk = calendar?.totalContributions ?? 0;
    contributionsAllTime += contributionsForChunk;
    mergeContributionCalendarDays(contributionsByDay, calendar?.weeks);
  }

  const activeDays = activeContributionDays(contributionsByDay);
  const currentStreakDays = currentStreakDaysFromActive(activeDays);
  const longestStreakDays = longestStreakDaysFromActive(activeDays);

  const repositoriesAffiliated = viewer?.repositories?.totalCount ?? 0;

  return {
    contributionsAllTime,
    repositoriesAffiliated,
    currentStreakDays,
    longestStreakDays,
  };
}

/**
 * Vérifie la config GitHub (token, viewer, alignement GITHUB_USERNAME) et journalise.
 * En `NODE_ENV === "development"` : détails (HTTP, GraphQL, login attendu).
 * Sinon : un seul message générique si la config ou l’API ne convient pas.
 */
export async function logGithubEnvStatus(): Promise<void> {
  const tag = "[github]";
  const dev = isExplicitDev();

  if (dev) {
    console.info(
      `${tag} vérification de la configuration (mode développement)`,
    );
  }

  const token = process.env.GITHUB_TOKEN?.trim();
  const username = process.env.GITHUB_USERNAME?.trim();

  if (!token) {
    if (dev) {
      console.warn(`${tag} GITHUB_TOKEN est absent ou vide.`);
    } else {
      console.warn(`${tag} les stats ne sont pas disponibles.`);
    }
    return;
  }

  if (dev && !username) {
    console.warn(
      `${tag} GITHUB_USERNAME est absent : le lien profil utilisera le fallback côté page.`,
    );
  }

  const query = /* GraphQL */ `
    query GithubEnvPing {
      viewer {
        login
      }
    }
  `;

  try {
    const response = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      cache: isDev ? "no-store" : "force-cache",
    });

    if (!response.ok) {
      if (dev) {
        const errorBody = await response.text();
        console.error(
          `${tag} réponse HTTP ${response.status} ${response.statusText}`,
          errorBody.slice(0, 500),
        );
      } else {
        console.warn(`${tag} les stats ne sont pas disponibles.`);
      }
      return;
    }

    const responseJson: unknown = await response.json();
    const graphqlPayload = responseJson as {
      data?: { viewer?: { login?: string | null } | null };
      errors?: Array<{ message?: string }>;
    };

    if (graphqlPayload.errors?.length) {
      if (dev) {
        console.error(
          `${tag} erreurs GraphQL :`,
          graphqlPayload.errors
            .map((graphqlError) => graphqlError.message)
            .join(" | "),
        );
      } else {
        console.warn(`${tag} les stats ne sont pas disponibles.`);
      }
      return;
    }

    const login = graphqlPayload.data?.viewer?.login;
    if (!login) {
      if (dev) {
        console.error(
          `${tag} pas de viewer.login (token invalide ou révoqué ?).`,
        );
      } else {
        console.warn(`${tag} les stats ne sont pas disponibles.`);
      }
      return;
    }

    if (username && login.toLowerCase() !== username.toLowerCase()) {
      if (dev) {
        console.warn(
          `${tag} GITHUB_USERNAME="${username}" ne correspond pas au compte du token (viewer="${login}"). getGithubStats() renverra null.`,
        );
      } else {
        console.warn(`${tag} les stats ne sont pas disponibles.`);
      }
      return;
    }

    if (dev) {
      console.info(
        `${tag} OK — compte API : "${login}"${username ? ` (GITHUB_USERNAME aligné)` : ""}.`,
      );
    }
  } catch (err) {
    if (dev) {
      console.error(`${tag} erreur réseau ou parsing :`, err);
    } else {
      console.warn(`${tag} les stats ne sont pas disponibles.`);
    }
  }
}
