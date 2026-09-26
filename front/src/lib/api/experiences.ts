import { z } from "zod";

import { fetchAllBackendPages } from "@/lib/api/backend";
import { plainTextFromHtml } from "@/lib/rich-text";

const experienceLocaleSchema = z.object({
  role: z.string(),
  summary: z.string(),
  content: z.string(),
  contractType: z.string(),
});

const backendExperienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  yearStart: z.number().int(),
  yearEnd: z.number().int().nullable(),
  fr: experienceLocaleSchema,
  en: experienceLocaleSchema,
});

export type BackendExperience = z.infer<typeof backendExperienceSchema>;

export type ExperienceLocaleContent = {
  role: string;
  summary: string;
  contractType: string;
  content: string;
};

export type PortfolioExperience = {
  id: string;
  company: string;
  yearStart: number;
  yearEnd: number | null;
  language: {
    fr: ExperienceLocaleContent;
    en: ExperienceLocaleContent;
  };
};

export async function loadPublicExperiences(): Promise<PortfolioExperience[]> {
  const experiences = await fetchAllBackendPages(
    "/api/experience",
    backendExperienceSchema,
  );
  return experiences.map(mapPortfolioExperience);
}

export function mapPortfolioExperience(
  experience: BackendExperience,
): PortfolioExperience {
  return {
    id: experience.id,
    company: experience.company,
    yearStart: experience.yearStart,
    yearEnd: experience.yearEnd,
    language: {
      fr: toLocaleContent(experience.fr),
      en: toLocaleContent(experience.en),
    },
  };
}

function toLocaleContent(
  locale: BackendExperience["fr"],
): ExperienceLocaleContent {
  const summary = locale.summary.trim() || plainTextFromHtml(locale.content);
  return {
    role: locale.role,
    summary,
    contractType: locale.contractType,
    content: plainTextFromHtml(locale.content),
  };
}
