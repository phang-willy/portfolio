import { isAppLocale, type AppLocale } from "@/features/i18n/config/locales";

type ParsedLang = { tag: string; q: number };

function parseAcceptLanguage(header: string): ParsedLang[] {
  const entries: ParsedLang[] = [];

  for (const part of header.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [primary, ...params] = trimmed.split(";").map((s) => s.trim());
    if (!primary) continue;

    let q = 1;
    for (const param of params) {
      const [key, rawValue] = param.split("=").map((s) => s.trim());
      if (key?.toLowerCase() === "q") {
        const parsed = Number.parseFloat(rawValue ?? "");
        if (!Number.isNaN(parsed)) {
          q = parsed;
        }
      }
    }

    entries.push({ tag: primary.toLowerCase(), q });
  }

  return entries.sort((a, b) => b.q - a.q);
}

function isFrenchLanguageTag(tag: string): boolean {
  return tag === "fr" || tag.startsWith("fr-");
}

function topAcceptLanguagePrefersFrench(acceptLanguage: string): boolean {
  const sorted = parseAcceptLanguage(acceptLanguage);
  const top = sorted[0]?.tag;
  if (!top) return false;
  return isFrenchLanguageTag(top);
}

/**
 * Résout la locale préférée pour la page d’accueil `/` uniquement (middleware).
 * Priorité : cookie `locale` valide → `Accept-Language` → défaut `fr`.
 */
export function resolveRootLocalePreference(input: {
  cookieLocale: string | undefined;
  acceptLanguage: string | null;
}): AppLocale {
  const raw = input.cookieLocale?.trim().toLowerCase();
  if (raw && isAppLocale(raw)) {
    return raw;
  }

  const header = input.acceptLanguage?.trim();
  if (header) {
    return topAcceptLanguagePrefersFrench(header) ? "fr" : "en";
  }

  return "fr";
}
