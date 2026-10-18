"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { AppLocale } from "@/features/i18n/config/locales";
import type { Dictionary } from "@/features/i18n/dictionaries/fr";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { getLocaleFromPathname } from "@/features/i18n/lib/pathname-locale";

export type I18n = {
  locale: AppLocale;
  pathname: string;
  t: Dictionary;
};

export function useI18n(): I18n {
  const pathname = usePathname();
  return useMemo(() => {
    const locale = getLocaleFromPathname(pathname);
    return {
      locale,
      pathname,
      t: getDictionary(locale),
    };
  }, [pathname]);
}
