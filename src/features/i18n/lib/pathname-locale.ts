import {
  ENGLISH_PATH_PREFIX,
  type AppLocale,
} from "@/features/i18n/config/locales";

function normalizeTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

const EN_PREFIX = `/${ENGLISH_PATH_PREFIX}`;

/**
 * Déduit la locale affichée depuis le chemin d’URL (source de vérité côté pages).
 * `/` et `/projects` → `fr` ; `/en` et `/en/...` → `en`.
 */
export function getLocaleFromPathname(pathname: string): AppLocale {
  const p = normalizeTrailingSlash(pathname);
  if (p === EN_PREFIX || p.startsWith(`${EN_PREFIX}/`)) {
    return "en";
  }
  return "fr";
}

export function isEnglishPathname(pathname: string): boolean {
  return getLocaleFromPathname(pathname) === "en";
}

/**
 * Retourne le chemin « canonique » sans préfixe `/en`, toujours commençant par `/`.
 * Ex. `/en/projects/a` → `/projects/a`, `/en` → `/`.
 */
export function stripEnglishPrefix(pathname: string): string {
  const p = normalizeTrailingSlash(pathname);
  if (p === EN_PREFIX) {
    return "/";
  }
  if (p.startsWith(`${EN_PREFIX}/`)) {
    const rest = p.slice(EN_PREFIX.length);
    return rest.length > 0 ? rest : "/";
  }
  return p.length > 0 ? p : "/";
}

/**
 * Construit le pathname localisé à partir d’un chemin canonique (sans `/en`).
 * `canonicalPathname` doit commencer par `/` (ex. `/`, `/contact`, `/projects/x`).
 */
export function buildLocalizedPathname(
  canonicalPathname: string,
  locale: AppLocale,
): string {
  const path = canonicalPathname.startsWith("/")
    ? canonicalPathname
    : `/${canonicalPathname}`;
  if (locale === "fr") {
    return path || "/";
  }
  if (path === "/") {
    return EN_PREFIX;
  }
  return `${EN_PREFIX}${path}`;
}
