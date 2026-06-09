"use client";

import type { AppLocale } from "@/features/i18n/config/locales";
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "@/features/i18n/lib/locale-cookie";

/**
 * Persiste le choix de langue pour les prochaines visites sur `/` (priorité middleware).
 */
export function writeLocaleCookie(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
