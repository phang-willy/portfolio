"use client";

import type { AppLocale } from "@/features/i18n/config/locales";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  parseLocaleCookieHeader,
} from "@/features/i18n/lib/locale-cookie";

/**
 * Persiste le choix de langue. L'accueil ouvre `/en` seulement si la valeur est `en`.
 */
export function writeLocaleCookie(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readLocaleCookie(): AppLocale | null {
  if (typeof document === "undefined") return null;
  return parseLocaleCookieHeader(document.cookie);
}
