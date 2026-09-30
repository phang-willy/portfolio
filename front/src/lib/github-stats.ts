import { getBackendApiUrl, portfolioDataRequestInit } from "@/lib/api/backend";

export type GithubStats = {
  contributionsAllTime: number;
  repositoriesAffiliated: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

/** Lit le cache du backend. Le rafraîchissement GitHub est fait par l'API. */
export async function getGithubStats(): Promise<GithubStats | null> {
  try {
    const response = await fetch(
      `${getBackendApiUrl()}/api/github-stats`,
      portfolioDataRequestInit(),
    );
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      success?: unknown;
      data?: GithubStats | null;
    };
    if (payload.success !== true || !payload.data) {
      return null;
    }

    const stats = payload.data;
    if (
      !Number.isFinite(stats.contributionsAllTime) ||
      !Number.isFinite(stats.repositoriesAffiliated) ||
      !Number.isFinite(stats.currentStreakDays) ||
      !Number.isFinite(stats.longestStreakDays)
    ) {
      return null;
    }

    return stats;
  } catch {
    return null;
  }
}
