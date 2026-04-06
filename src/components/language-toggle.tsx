"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/features/i18n/config/locales";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { writeLocaleCookie } from "@/features/i18n/lib/locale-cookie-client";
import {
  buildLocalizedPathname,
  stripEnglishPrefix,
} from "@/features/i18n/lib/pathname-locale";
import ReactCountryFlag from "react-country-flag";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

/** Codes ISO 3166-1 alpha-2 pour les drapeaux (anglais → GB). */
const COUNTRY_CODE_BY_LOCALE: Record<AppLocale, string> = {
  fr: "FR",
  en: "GB",
};

function LocaleFlag({
  locale,
  style,
}: {
  locale: AppLocale;
  style?: CSSProperties;
}) {
  return (
    <ReactCountryFlag
      svg
      countryCode={COUNTRY_CODE_BY_LOCALE[locale]}
      alt=""
      aria-hidden
      className="inline-block shrink-0 rounded-sm object-cover"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
}

export const LanguageToggle = () => {
  const router = useRouter();
  const { locale, pathname, t } = useI18n();

  const navigateToLocale = (next: AppLocale) => {
    if (next === locale) return;
    writeLocaleCookie(next);
    const canonical = stripEnglishPrefix(pathname);
    router.push(buildLocalizedPathname(canonical, next));
  };

  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="icon"
          aria-label={t.language.triggerAria}
          title={t.language.triggerAria}
        >
          <LocaleFlag
            locale={locale}
            style={{ width: "1.375rem", height: "1.03125rem" }}
          />
          <span className="sr-only">
            {locale === "fr" ? t.language.srCurrentFr : t.language.srCurrentEn}
          </span>
        </Button>
      }
    >
      {({ close }) => (
        <div className="flex flex-col p-1 rounded-md border bg-white dark:bg-dark-500">
          <Button
            onClick={() => {
              navigateToLocale("fr");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
            aria-current={locale === "fr" ? "true" : undefined}
          >
            <LocaleFlag
              locale="fr"
              style={{ width: "1.125rem", height: "0.84375rem" }}
            />
            {t.language.french}
            <span className="sr-only">{t.language.srSwitchToFrench}</span>
          </Button>
          <Button
            onClick={() => {
              navigateToLocale("en");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
            aria-current={locale === "en" ? "true" : undefined}
          >
            <LocaleFlag
              locale="en"
              style={{ width: "1.125rem", height: "0.84375rem" }}
            />
            {t.language.english}
            <span className="sr-only">{t.language.srSwitchToEnglish}</span>
          </Button>
        </div>
      )}
    </Dropdown>
  );
};
