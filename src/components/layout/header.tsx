"use client";

import { ThemeToggle } from "@/features/theme/components/theme-toggle";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuLinks: MenuItem[] = [
    {
      type: "link-image",
      href: "/",
      imageSrc: "/profile.webp",
      imageAlt: "PHANG Willy - Développeur Full Stack",
      srLabel: "Accueil",
    },
    { type: "link", href: "/projects", label: "Projets" },
    { type: "link", href: "/contact", label: "Contact" },
  ];

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
              aria-label="Ouvrir le menu"
            >
              <LuMenu className="w-4 h-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>

          <ul className="flex items-center gap-4">
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
              <Link href="/">
                <Image
                  src="/profile.webp"
                  alt="PHANG Willy - Développeur Full Stack"
                  className="rounded-full w-8 h-8 object-cover"
                  width={500}
                  height={500}
                  loading="eager"
                />
                <span className="sr-only">Accueil</span>
              </Link>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <LuX className="w-4 h-4" />
              <span className="sr-only">Fermer le menu</span>
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
