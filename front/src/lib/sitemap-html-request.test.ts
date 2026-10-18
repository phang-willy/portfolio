import { describe, expect, it } from "vitest";

import { requestWantsSitemapHtml } from "@/lib/sitemap-html-request";

const browserAccept =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

describe("requestWantsSitemapHtml", () => {
  it("shows HTML to a browser", () => {
    expect(
      requestWantsSitemapHtml(browserAccept, "Mozilla/5.0 Chrome/149.0.0.0"),
    ).toBe(true);
  });

  it("keeps XML for crawlers, even with a browser Accept header", () => {
    expect(
      requestWantsSitemapHtml(
        browserAccept,
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(false);
  });

  it("keeps XML when the client does not prefer HTML", () => {
    expect(requestWantsSitemapHtml("*/*", "curl/8.0")).toBe(false);
    expect(requestWantsSitemapHtml("application/xml", "curl/8.0")).toBe(false);
    expect(requestWantsSitemapHtml(null, null)).toBe(false);
  });
});