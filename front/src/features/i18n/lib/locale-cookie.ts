import { isAppLocale, type AppLocale } from "@/features/i18n/config/locales";

export const LOCALE_COOKIE_NAME = "locale";

/** 1 an - aligné avec un choix utilisateur stable. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function serializeLocaleCookieValue(locale: AppLocale): string {
  return locale;
}

/** Lit `locale` dans un en-tête Cookie. `en` et `fr` seulement, sinon `null`. */
export function parseLocaleCookieHeader(
  cookieHeader: string,
): AppLocale | null {
  const prefix = `${LOCALE_COOKIE_NAME}=`;
  const parts = cookieHeader ? cookieHeader.split("; ") : [];

  for (const part of parts) {
    if (!part.startsWith(prefix)) continue;
    try {
      const value = decodeURIComponent(part.slice(prefix.length))
        .trim()
        .toLowerCase();
      return isAppLocale(value) ? value : null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Cible quand l'accueil français est ouvert avec le cookie `en`.
 * Les autres chemins restent tels quels : seul `/` suit cette préférence.
 */
export function homeLocaleRedirectPath(
  pathname: string,
  cookieLocale: AppLocale | null,
  search = "",
  hash = "",
): string | null {
  if (pathname !== "/" && pathname !== "") return null;
  if (cookieLocale !== "en") return null;
  return `/en${search}${hash}`;
}
