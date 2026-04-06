import { headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/features/i18n/config/locales";

export const APP_LOCALE_HEADER = "x-app-locale";

/**
 * Locale injectée par le middleware à partir du pathname (RSC / generateMetadata).
 */
export async function getRequestLocale(): Promise<AppLocale> {
  const value = (await headers()).get(APP_LOCALE_HEADER)?.trim().toLowerCase();
  if (value && isAppLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}
