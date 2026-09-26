import { describe, expect, it } from "vitest";

import {
  recordsToSitemapHtml,
  recordsToSitemapXml,
  type SitemapRecord,
} from "@/lib/sitemap-entries";

const home: SitemapRecord = {
  url: "https://example.com/",
  alternates: [
    { hreflang: "fr", href: "https://example.com/" },
    { hreflang: "en", href: "https://example.com/en" },
    { hreflang: "x-default", href: "https://example.com/" },
  ],
};

describe("recordsToSitemapXml", () => {
  it("links French and English versions with hreflang", () => {
    const xml = recordsToSitemapXml([
      home,
      {
        ...home,
        url: "https://example.com/en",
      },
    ]);

    expect(xml).not.toContain("xml-stylesheet");
    expect(xml).toContain(
      'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="fr" href="https://example.com/" />',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://example.com/en" />',
    );
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/" />',
    );
    expect(xml).not.toContain("<lastmod>");
  });

  it("keeps a real last modification date", () => {
    const xml = recordsToSitemapXml([
      {
        ...home,
        lastModified: new Date("2026-03-01T00:00:00.000Z"),
      },
    ]);

    expect(xml).toContain("<lastmod>2026-03-01T00:00:00.000Z</lastmod>");
  });
});

describe("recordsToSitemapHtml", () => {
  it("renders a table without XSLT", () => {
    const html = recordsToSitemapHtml([
      {
        ...home,
        lastModified: new Date("2026-03-01T00:00:00.000Z"),
      },
    ]);

    expect(html).toContain("<table>");
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain("fr, en");
    expect(html).toContain("2026-03-01");
    expect(html).not.toContain("x-default");
    expect(html).not.toContain("xsl");
  });
});
