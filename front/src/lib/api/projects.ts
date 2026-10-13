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
  githubCreatedAt: z.string().nullable().optional(),
  githubUpdatedAt: z.string().nullable().optional(),
  stacks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().nullable().optional(),
    }),
  ),
  lang: z.object({
    fr: projectLocaleSchema,
    en: projectLocaleSchema,
  }),
});

export type BackendProject = z.infer<typeof backendProjectSchema>;

export type ProjectLocaleContent = {
  name: string;
  description: string;
  imageAlt: string;
  content: string;
};

export type ProjectStack = {
  id: string;
  name: string;
  image: string | null;
};

export type PortfolioProject = {
  id: string;
  image: string;
  links: {
    url?: string;
    github?: string;
  };
  stacks: ProjectStack[];
  createdAt: string;
  updatedAt: string;
  /** Full ISO timestamp used to order projects. Null when the repo has no GitHub date yet. */
  githubUpdatedAt: string | null;
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
  const githubCreatedAt = optionalInstant(project.githubCreatedAt);
  const githubUpdatedAt = optionalInstant(project.githubUpdatedAt);

  return {
    id: project.slug,
    image: toProjectImageSrc(project.imageLink),
    links: {
      url: optionalUrl(project.productionLink),
      github: optionalUrl(project.sourceCodeLink),
    },
    stacks: project.stacks.flatMap((stack) => {
      const name = stack.name.trim();
      if (!name) {
        return [];
      }
      const image = stack.image?.trim();
      return [{ id: stack.id, name, image: image ? image : null }];
    }),
    createdAt: githubCreatedAt ? githubCreatedAt.slice(0, 10) : createdAt,
    updatedAt: githubUpdatedAt ? githubUpdatedAt.slice(0, 10) : updatedAt,
    githubUpdatedAt,
    language: {
      fr: toLocaleContent(project.lang.fr),
      en: toLocaleContent(project.lang.en),
    },
  };
}

export function toProjectImageSrc(
  imageLink: string | null | undefined,
): string {
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

function toLocaleContent(locale: BackendProject["lang"]["fr"]): ProjectLocaleContent {
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

function optionalInstant(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
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
