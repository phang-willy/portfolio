import { describe, expect, it } from "vitest";

import { readLastCommitDate } from "@/lib/sitemap-commit-date";
import {
  formatSitemapLastmod,
  latestProjectUpdate,
} from "@/lib/sitemap-lastmod";

describe("formatSitemapLastmod", () => {
  it("uses Paris time without milliseconds", () => {
    expect(formatSitemapLastmod(new Date("2026-01-15T21:18:41.000Z"))).toBe(
      "2026-01-15T22:18:41+01:00",
    );
    expect(formatSitemapLastmod(new Date("2026-07-08T15:30:00.000Z"))).toBe(
      "2026-07-08T17:30:00+02:00",
    );
  });
});

describe("latestProjectUpdate", () => {
  it("keeps the newest project instant, including a date-only fallback", () => {
    const latest = latestProjectUpdate([
      {
        githubUpdatedAt: "2026-01-15T21:18:41.000Z",
        updatedAt: "2026-01-15",
      },
      {
        githubUpdatedAt: null,
        updatedAt: "2026-03-02",
      },
    ]);

    expect(latest).toEqual(new Date("2026-03-02T00:00:00+01:00"));
  });
});

describe("readLastCommitDate", () => {
  it("reads the repository commit when git is available", () => {
    const date = readLastCommitDate();
    if (!date) return;
    expect(formatSitemapLastmod(date)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );
  });
});
