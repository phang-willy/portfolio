"use client";

import { Menu, type MenuItem } from "@/components/ui/menu";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { useMemo } from "react";

export function FooterNav() {
  const { locale, t } = useI18n();

  const items = useMemo((): MenuItem[] => {
    return [
      {
        type: "link",
        href: buildLocalizedPathname("/legals", locale),
        label: t.footer.legals,
      },
      {
        type: "link",
        href: buildLocalizedPathname("/contact", locale),
        label: t.footer.contact,
      },
    ];
  }, [locale, t.footer.contact, t.footer.legals]);

  return (
    <ul className="flex flex-col items-center gap-4 xl:flex-row xl:gap-6">
      <Menu items={items} />
    </ul>
  );
}
