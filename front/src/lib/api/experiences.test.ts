import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadPublicExperiences,
  mapPortfolioExperience,
  type BackendExperience,
} from "@/lib/api/experiences";
import { PortfolioApiError } from "@/lib/api/backend";
import { experienceItemForLocale } from "@/features/i18n/lib/localized-site-data";

const finished: BackendExperience = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  company: "DIT",
  yearStart: 2023,
  yearEnd: 2025,
  fr: {
    role: "Développeur Full Stack",
    summary: "Applications métier",
    content: "",
    contractType: "Contrat en alternance",
  },
  en: {
    role: "Full Stack Developer",
    summary: "Business applications",
    content: "",
    contractType: "Work-study contract",
  },
};

const ongoing: BackendExperience = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  company: "Studio",
  yearStart: 2026,
  yearEnd: null,
  fr: {
    role: "Développeur",
    summary: "",
    content: "<p>Mission en cours</p>",
    contractType: "CDI",
  },
  en: {
    role: "Developer",
    summary: "",
    content: "<p>Current mission</p>",
    contractType: "Permanent",
  },
};

function page(data: unknown[]) {
  return {
    success: true,
    code: 200,
    message: "OK",
    data,
    pagination: {
      page: 0,
      size: 200,
      totalItems: data.length,
      totalPages: data.length === 0 ? 0 : 1,
    },
  };
}

describe("experience API mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BACKEND_API_URL;
  });

  it("maps a finished experience in French and English", () => {
    const experience = mapPortfolioExperience(finished);

    expect(experienceItemForLocale(experience, "fr")).toMatchObject({
      company: "DIT",
      role: "Développeur Full Stack",
      contractType: "Contrat en alternance",
      summary: "Applications métier",
      startYear: "2023",
      endYear: "2025",
    });
    expect(experienceItemForLocale(experience, "en").role).toBe(
      "Full Stack Developer",
    );
    expect(experienceItemForLocale(experience, "en").contractType).toBe(
      "Work-study contract",
    );
  });

  it("maps an ongoing experience with an empty end year and HTML summary fallback", () => {
    const experience = mapPortfolioExperience(ongoing);
    const item = experienceItemForLocale(experience, "fr");

    expect(experience.yearEnd).toBeNull();
    expect(item.endYear).toBe("");
    expect(item.summary).toBe("Mission en cours");
    expect(experienceItemForLocale(experience, "en").summary).toBe(
      "Current mission",
    );
  });

  it("loads a valid experience list", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(page([finished, ongoing]))),
    );

    const experiences = await loadPublicExperiences();

    expect(experiences).toHaveLength(2);
    expect(experiences[1]?.yearEnd).toBeNull();
  });

  it("keeps an empty backend list empty", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(page([]))));

    await expect(loadPublicExperiences()).resolves.toEqual([]);
  });

  it("rejects an HTTP error", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    await expect(loadPublicExperiences()).rejects.toBeInstanceOf(
      PortfolioApiError,
    );
    await expect(loadPublicExperiences()).rejects.toMatchObject({ status: 500 });
  });
});
