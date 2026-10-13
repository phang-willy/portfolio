import { describe, expect, it } from "vitest";

import type { PortfolioProject } from "@/lib/api/projects";
import { compareByGithubUpdatedAtDesc } from "@/lib/projects";

function project(
  id: string,
  githubUpdatedAt: string | null,
  createdAt = "2024-01-01",
): PortfolioProject {
  return {
    id,
    image: "/fallback.webp",
    links: {},
    stacks: [],
    createdAt,
    updatedAt: createdAt,
    githubUpdatedAt,
    language: {
      fr: { name: id, description: "", imageAlt: "", content: "" },
      en: { name: id, description: "", imageAlt: "", content: "" },
    },
  };
}

describe("compareByGithubUpdatedAtDesc", () => {
  it("puts the newest GitHub update first and projects without a date last", () => {
    const projects = [
      project("plain", null, "2026-09-01"),
      project("older", "2025-01-01T00:00:00.000Z"),
      project("newer", "2026-08-01T00:00:00.000Z"),
    ];

    expect(projects.sort(compareByGithubUpdatedAtDesc).map((item) => item.id)).toEqual([
      "newer",
      "older",
      "plain",
    ]);
  });
});
