import { describe, expect, it } from "vitest";

import { sitemapRequestAllowed } from "@/lib/sitemap-auth";

describe("sitemapRequestAllowed", () => {
  it("refuses when the token is not configured", () => {
    expect(sitemapRequestAllowed("secret", undefined)).toEqual({
      ok: false,
      status: 503,
    });
    expect(sitemapRequestAllowed("secret", "   ")).toEqual({
      ok: false,
      status: 503,
    });
  });

  it("refuses a missing or wrong token", () => {
    expect(sitemapRequestAllowed(null, "secret")).toEqual({
      ok: false,
      status: 401,
    });
    expect(sitemapRequestAllowed("other", "secret")).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("accepts the configured token", () => {
    expect(sitemapRequestAllowed("secret", "secret")).toEqual({ ok: true });
  });
});
