"use client";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/features/theme/components/theme-toggle";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { locale, t } = useI18n();

  const menuLinks: MenuItem[] = useMemo(
    () => [
      {
        type: "link-image",
        href: buildLocalizedPathname("/", locale),
        imageSrc: "/profile.webp",
        imageAlt: t.message.profileAlt,
        srLabel: t.nav.homeSr,
      },
      {
        type: "link",
        href: buildLocalizedPathname("/projects", locale),
        label: t.nav.projects,
      },
      {
        type: "link",
        href: buildLocalizedPathname("/contact", locale),
        label: t.nav.contact,
      },
    ],
    [locale, t.message.profileAlt, t.nav],
  );

  return (
    <header className="sticky top-0 z-60 border-b bg-white dark:bg-black">
      <div className="container mx-auto p-4">
        <nav className="flex items-center justify-between">
          <div className="hidden md:block">
            <ul className="flex items-center gap-6">
              <Menu items={menuLinks} />
            </ul>
          </div>

          <div className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="relative z-50"
              aria-label={t.nav.openMenu}
            >
              <LuMenu className="w-4 h-4" />
              <span className="sr-only">{t.nav.menuSr}</span>
            </Button>
          </div>

          <ul className="flex items-center gap-4">
            <li>
              <LanguageToggle />
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden opacity-100"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r transition-transform duration-300 md:hidden bg-white dark:bg-black ${
          isMobileMenuOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <div className="grid grid-cols-1">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Link
                href={buildLocalizedPathname("/", locale)}
                className="relative block size-8 shrink-0 overflow-hidden rounded-full"
              >
                <Image
                  src="/profile.webp"
                  alt={t.message.profileAlt}
                  fill
                  sizes="32px"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover"
                />
                <span className="sr-only">{t.nav.homeSr}</span>
              </Link>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label={t.nav.closeMenu}
            >
              <LuX className="w-4 h-4" />
              <span className="sr-only">{t.nav.closeMenuSr}</span>
            </Button>
          </div>

          <ul className="grid grid-cols-1">
            {menuLinks.map((link) =>
              link.type === "link" ? (
                <li key={`mobile-${link.type}-${link.href}`}>
                  <Link
                    href={link.href}
                    className={`text-sm xl:text-base font-medium transition-colors duration-300 block p-4 ${
                      pathname === link.href
                        ? "bg-main text-white"
                        : "hover:bg-main hover:text-white"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </aside>
    </header>
  );
};
