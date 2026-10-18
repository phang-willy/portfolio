import {
  type AppLocale,
  SUPPORTED_LOCALES,
} from "@/features/i18n/config/locales";

/** Codes Open Graph (og:locale / og:locale:alternate). */
const OG_LOCALE_BY_APP: Record<AppLocale, string> = {
  fr: "fr_FR",
  en: "en_US",
};

/** Champs `openGraph.locale` et `openGraph.alternateLocale` pour Next.js Metadata. */
export function openGraphLocaleFields(locale: AppLocale): {
  locale: string;
  alternateLocale: string[];
} {
  const primary = OG_LOCALE_BY_APP[locale];
  const alternateLocale = SUPPORTED_LOCALES.filter((l) => l !== locale).map(
    (l) => OG_LOCALE_BY_APP[l],
  );
  return { locale: primary, alternateLocale };
}
