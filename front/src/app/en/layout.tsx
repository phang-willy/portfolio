import type { Metadata } from "next";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";

/** Sous-arbre /en : métadonnées Open Graph en anglais (fusion avec le layout racine). */
export const metadata: Metadata = {
  openGraph: openGraphLocaleFields("en"),
};

export default function EnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
