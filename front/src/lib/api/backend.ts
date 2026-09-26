import { z } from "zod";

/**
 * En production, les GET Spring restent dans le Data Cache Next pendant 300 secondes.
 * Une modification faite dans l’admin Angular apparaît alors sans nouveau déploiement.
 * En développement, le cache est ignoré. Les pages accueil / projets sont
 * `force-dynamic`, donc un rafraîchissement relit Spring tout de suite.
 *
 * Une réponse HTTP 200 avec `data: []` est une liste vide. Une erreur réseau, un
 * statut non 2xx ou un JSON qui ne correspond pas au schéma lèvent `PortfolioApiError`.
 */
export const PORTFOLIO_DATA_REVALIDATE_SECONDS = 300;

export function portfolioDataRequestInit(): RequestInit {
  if (process.env.NODE_ENV === "development") {
    return { cache: "no-store" };
  }
  return { next: { revalidate: PORTFOLIO_DATA_REVALIDATE_SECONDS } };
}

const MAX_PAGES = 20;

export class PortfolioApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PortfolioApiError";
    this.status = status;
  }
}

const paginationSchema = z.object({
  page: z.number().int(),
  size: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});

export function getBackendApiUrl(): string {
  const value = process.env.BACKEND_API_URL?.trim().replace(/\/+$/, "");
  if (!value) {
    throw new PortfolioApiError("BACKEND_API_URL is not configured", 503);
  }
  return value;
}

export async function fetchAllBackendPages<T>(
  path: string,
  itemSchema: z.ZodType<T>,
): Promise<T[]> {
  const pageSchema = z.object({
    success: z.literal(true),
    code: z.number(),
    message: z.string(),
    data: z.array(itemSchema),
    pagination: paginationSchema,
  });

  const items: T[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < MAX_PAGES) {
    const payload = await fetchBackendJson(
      `${path}?page=${page}&size=200`,
    );
    const parsed = pageSchema.safeParse(payload);
    if (!parsed.success) {
      throw new PortfolioApiError("Invalid backend payload", 502);
    }

    items.push(...parsed.data.data);
    totalPages = parsed.data.pagination.totalPages;
    page += 1;
    if (parsed.data.data.length === 0) {
      break;
    }
  }

  return items;
}

async function fetchBackendJson(path: string): Promise<unknown> {
  const url = `${getBackendApiUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, portfolioDataRequestInit());
  } catch {
    throw new PortfolioApiError("Backend is unavailable", 503);
  }

  if (!response.ok) {
    throw new PortfolioApiError(
      `Backend responded with HTTP ${response.status}`,
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new PortfolioApiError("Invalid backend payload", 502);
  }
}
