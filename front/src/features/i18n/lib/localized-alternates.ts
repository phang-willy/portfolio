import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/features/i18n/config/locales";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";

/**
 * Canonical de la langue courante, plus les alternates hreflang.
 * Chaque URL se désigne elle-même. Le français n'est pas un doublon de l'anglais.
 */
export function localizedAlternates(
  canonicalPath: string,
  locale: AppLocale,
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const supported of SUPPORTED_LOCALES) {
    languages[supported] = buildLocalizedPathname(canonicalPath, supported);
  }
  languages["x-default"] = buildLocalizedPathname(
    canonicalPath,
    DEFAULT_LOCALE,
  );

  return {
    canonical: buildLocalizedPathname(canonicalPath, locale),
    languages,
  };
}
