import type { AppLocale } from "@/features/i18n/config/locales";

export const LOCALE_COOKIE_NAME = "locale";

/** 1 an — aligné avec un choix utilisateur stable. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function serializeLocaleCookieValue(locale: AppLocale): string {
  return locale;
}
