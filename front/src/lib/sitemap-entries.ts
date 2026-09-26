import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/features/i18n/config/locales";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { getSiteBaseUrl } from "@/lib/site-base-url";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";

export const SITEMAP_STATIC_CANONICAL = [
  "/",
  "/projects",
  "/contact",
  "/legals",
] as const;

export type SitemapAlternate = {
  hreflang: string;
  href: string;
};

export type SitemapRecord = {
  url: string;
  lastModified?: Date;
  alternates: SitemapAlternate[];
};

function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteBaseUrl().origin).href;
}

function localizedRecords(
  canonicalPath: string,
  lastModified?: Date,
): SitemapRecord[] {
  const hrefByLocale = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      absoluteUrl(buildLocalizedPathname(canonicalPath, locale)),
    ]),
  ) as Record<AppLocale, string>;

  const alternates: SitemapAlternate[] = [
    ...SUPPORTED_LOCALES.map((locale) => ({
      hreflang: locale,
      href: hrefByLocale[locale],
    })),
    { hreflang: "x-default", href: hrefByLocale[DEFAULT_LOCALE] },
  ];

  return SUPPORTED_LOCALES.map((locale) => ({
    url: hrefByLocale[locale],
    lastModified,
    alternates,
  }));
}

function projectLastModified(updatedAt: string): Date | undefined {
  const date = new Date(`${updatedAt}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Utilisé par le script `generate-sitemap-xml` et par POST /api/sitemap. */
export async function getSitemapRecords(): Promise<SitemapRecord[]> {
  let projects: Awaited<ReturnType<typeof getProjectsByCreatedAtDesc>> = [];
  try {
    projects = await getProjectsByCreatedAtDesc();
  } catch (error) {
    console.warn(
      "[sitemap] projects unavailable, writing static routes only",
      error,
    );
  }

  return [
    ...SITEMAP_STATIC_CANONICAL.flatMap((canonical) =>
      localizedRecords(canonical),
    ),
    ...projects.flatMap((project) =>
      localizedRecords(
        `/projects/${project.id}`,
        projectLastModified(project.updatedAt),
      ),
    ),
  ];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Page lisible dans le navigateur. Le XML servi aux robots n’utilise pas XSLT. */
export function recordsToSitemapHtml(records: SitemapRecord[]): string {
  const rows = records
    .map((record) => {
      const languages = record.alternates
        .filter((alternate) => alternate.hreflang !== "x-default")
        .map((alternate) => escapeXml(alternate.hreflang))
        .join(", ");
      const updated = record.lastModified
        ? escapeXml(record.lastModified.toISOString().slice(0, 10))
        : "";
      const url = escapeXml(record.url);
      return `<tr><td><a href="${url}">${url}</a></td><td class="langs">${languages}</td><td class="date">${updated}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="robots" content="noindex"/>
  <title>Sitemap XML</title>
  <style>
    body { margin: 0; background: #f6f7f8; color: #1c1c1c; font-family: Helvetica, Arial, sans-serif; font-size: 14px; }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { margin: 0 0 8px; font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
    .intro { margin: 0 0 22px; color: #4b4b4b; line-height: 1.5; }
    .intro a { color: #0b57d0; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e4e4e4; }
    th { text-align: left; font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; color: #555; padding: 12px 14px; border-bottom: 1px solid #111; }
    td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; }
    tbody tr:nth-child(odd) td { background: #f3f3f3; }
    tbody tr:hover td { background: #e7e7e7; }
    a { color: #111; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
    .langs, .date { white-space: nowrap; color: #333; }
  </style>
</head>
<body>
  <main>
    <h1>Sitemap XML</h1>
    <p class="intro">Ce fichier liste les pages du site pour les moteurs de recherche. Il contient ${records.length} adresses. Plus d’informations sur <a href="https://www.sitemaps.org/">sitemaps.org</a>.</p>
    <table>
      <thead><tr><th>URL</th><th>Langues</th><th>Dernière modification</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}

export function recordsToSitemapXml(records: SitemapRecord[]): string {
  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
  ];

  for (const { url, lastModified, alternates } of records) {
    lines.push(`  <url>`, `    <loc>${escapeXml(url)}</loc>`);
    for (const alternate of alternates) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}" />`,
      );
    }
    if (lastModified) {
      lines.push(`    <lastmod>${escapeXml(lastModified.toISOString())}</lastmod>`);
    }
    lines.push(`  </url>`);
  }

  lines.push(`</urlset>`);
  return `${lines.join("\n")}\n`;
}
