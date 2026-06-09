import type { AppLocale } from "@/features/i18n/config/locales";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { getSiteBaseUrl } from "@/lib/site-base-url";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";

export const SITEMAP_STATIC_CANONICAL = [
  "/",
  "/projects",
  "/contact",
  "/legals",
] as const;

export type SitemapRecord = {
  url: string;
  lastModified: Date;
};

function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteBaseUrl().origin).href;
}

/** Utilisé par `app/sitemap.ts` (MetadataRoute) et par le script `generate-sitemap-xml`. */
export async function getSitemapRecords(): Promise<SitemapRecord[]> {
  const lastModified = new Date();
  const projects = await getProjectsByCreatedAtDesc();
  const locales: Array<AppLocale> = ["fr", "en"];

  const entries: SitemapRecord[] = [];

  for (const canonical of SITEMAP_STATIC_CANONICAL) {
    for (const locale of locales) {
      const path = buildLocalizedPathname(canonical, locale);
      entries.push({
        url: absoluteUrl(path),
        lastModified,
      });
    }
  }

  for (const project of projects) {
    for (const locale of locales) {
      const path = buildLocalizedPathname(`/projects/${project.id}`, locale);
      entries.push({
        url: absoluteUrl(path),
        lastModified,
      });
    }
  }

  return entries;
}

export function recordsToSitemapXml(records: SitemapRecord[]): string {
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ];

  for (const { url, lastModified } of records) {
    const iso = lastModified.toISOString();
    lines.push(
      `  <url>`,
      `    <loc>${escapeXml(url)}</loc>`,
      `    <lastmod>${escapeXml(iso)}</lastmod>`,
      `  </url>`,
    );
  }

  lines.push(`</urlset>`);
  return `${lines.join("\n")}\n`;
}
