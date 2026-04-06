"use client";

import Image from "next/image";
import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/features/i18n/config/locales";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { writeLocaleCookie } from "@/features/i18n/lib/locale-cookie-client";
import {
  buildLocalizedPathname,
  stripEnglishPrefix,
} from "@/features/i18n/lib/pathname-locale";
import { useRouter } from "next/navigation";

const FLAG_SRC: Record<AppLocale, string> = {
  fr: "/flags/fr.svg",
  en: "/flags/gb.svg",
};

/** SVG locaux : les drapeaux emoji ne s’affichent pas sur Chrome/Edge Windows (Segoe UI). */
function LocaleFlag({
  locale,
  size,
}: {
  locale: AppLocale;
  size: "md" | "sm";
}) {
  const { w, h } = size === "md" ? { w: 22, h: 15 } : { w: 18, h: 12 };
  const box =
    size === "md" ? "h-[15px] w-[22px]" : "h-[12px] w-[18px]";
  return (
    <Image
      src={FLAG_SRC[locale]}
      alt=""
      width={w}
      height={h}
      unoptimized
      draggable={false}
      aria-hidden
      className={`max-w-none shrink-0 object-cover ${box}`}
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
          <LocaleFlag locale={locale} size="md" />
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
            <LocaleFlag locale="fr" size="sm" />
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
            <LocaleFlag locale="en" size="sm" />
            {t.language.english}
            <span className="sr-only">{t.language.srSwitchToEnglish}</span>
          </Button>
        </div>
      )}
    </Dropdown>
  );
};
