import { z } from "zod";

import { fetchAllBackendPages, PortfolioApiError } from "@/lib/api/backend";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";
import { plainTextFromHtml } from "@/lib/rich-text";

const projectLocaleSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string(),
  imageAlt: z.string(),
});

const backendProjectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  productionLink: z.string().nullable(),
  sourceCodeLink: z.string().nullable(),
  imageLink: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  stacks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  fr: projectLocaleSchema,
  en: projectLocaleSchema,
});

export type BackendProject = z.infer<typeof backendProjectSchema>;

export type ProjectLocaleContent = {
  name: string;
  description: string;
  imageAlt: string;
  content: string;
};

export type PortfolioProject = {
  id: string;
  image: string;
  links: {
    url?: string;
    github?: string;
  };
  stacks: string[];
  createdAt: string;
  updatedAt: string;
  language: {
    fr: ProjectLocaleContent;
    en: ProjectLocaleContent;
  };
};

export type ProjectRecord = Omit<PortfolioProject, "language"> & {
  name: string;
  description: string;
  imageAlt: string;
  content: string;
};

export async function loadPublicProjects(): Promise<PortfolioProject[]> {
  const projects = await fetchAllBackendPages(
    "/api/project",
    backendProjectSchema,
  );
  return projects.map(mapPortfolioProject);
}

export function mapPortfolioProject(project: BackendProject): PortfolioProject {
  const createdAt = toIsoDate(project.createdAt);
  const updatedAt = toIsoDate(project.updatedAt ?? project.createdAt);

  return {
    id: project.slug,
    image: toProjectImageSrc(project.imageLink),
    links: {
      url: optionalUrl(project.productionLink),
      github: optionalUrl(project.sourceCodeLink),
    },
    stacks: project.stacks.map((stack) => stack.name).filter((name) => name.trim()),
    createdAt,
    updatedAt,
    language: {
      fr: toLocaleContent(project.fr),
      en: toLocaleContent(project.en),
    },
  };
}

export function toProjectImageSrc(imageLink: string | null | undefined): string {
  const value = imageLink?.trim();
  if (!value) {
    return PROJECT_IMAGE_FALLBACK_PATH;
  }

  if (value.startsWith("/api/project/image/")) {
    return value;
  }

  try {
    const url = new URL(value);
    const marker = "/api/project/image/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0) {
      return url.pathname.slice(index);
    }
  } catch {
    return PROJECT_IMAGE_FALLBACK_PATH;
  }

  return PROJECT_IMAGE_FALLBACK_PATH;
}

function toLocaleContent(
  locale: BackendProject["fr"],
): ProjectLocaleContent {
  return {
    name: locale.title,
    description: locale.description,
    imageAlt: locale.imageAlt || locale.title,
    content: plainTextFromHtml(locale.content),
  };
}

function optionalUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toIsoDate(value: string | null | undefined): string {
  if (!value) {
    throw new PortfolioApiError("Invalid project date", 502);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new PortfolioApiError("Invalid project date", 502);
  }
  return date.toISOString().slice(0, 10);
}
