export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";

/** Segments d’URL pour la locale secondaire (préfixe `/en`). */
export const ENGLISH_PATH_PREFIX = "en";

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
