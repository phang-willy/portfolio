"use client";

import { useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname } from "@/features/i18n/lib/pathname-locale";
import { homeLocaleRedirectPath } from "@/features/i18n/lib/locale-cookie";
import { readLocaleCookie } from "@/features/i18n/lib/locale-cookie-client";

/**
 * Le script beforeInteractive ne couvre que le premier document.
 * Ici, une navigation client vers `/` relit le cookie et ouvre `/en` si besoin.
 */
export function HomeLocaleRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    const target = homeLocaleRedirectPath(
      pathname,
      readLocaleCookie(),
      window.location.search,
      window.location.hash,
    );
    if (target) {
      document.documentElement.lang = "en";
      router.replace(target);
      return;
    }

    document.documentElement.lang =
      getLocaleFromPathname(pathname) === "en" ? "en" : "fr";
  }, [pathname, router]);

  return null;
}
