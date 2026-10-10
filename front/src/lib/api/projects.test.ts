import { afterEach, describe, expect, it, vi } from "vitest";

import { PortfolioApiError } from "@/lib/api/backend";
import {
  loadPublicProjects,
  mapPortfolioProject,
  toProjectImageSrc,
  type BackendProject,
} from "@/lib/api/projects";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";

const projectWithStacks: BackendProject = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "geolock",
  productionLink: "https://geolock.example",
  sourceCodeLink: "https://github.com/example/geolock",
  imageLink: "/api/project/image/geolock.webp",
  createdAt: "2025-04-20T08:00:00Z",
  updatedAt: "2026-03-01T08:00:00Z",
  stacks: [
    { id: "s1", name: "React" },
    { id: "s2", name: "PostgreSQL" },
  ],
  fr: {
    title: "Geolock",
    description: "Suivi de véhicules",
    content: "<p>Contenu FR</p>",
    imageAlt: "Aperçu Geolock",
  },
  en: {
    title: "Geolock",
    description: "Vehicle tracking",
    content: "<p>EN content</p>",
    imageAlt: "Geolock preview",
  },
};

const projectWithoutStacks: BackendProject = {
  ...projectWithStacks,
  id: "22222222-2222-2222-2222-222222222222",
  slug: "notes",
  stacks: [],
  imageLink: null,
  productionLink: null,
  sourceCodeLink: "  ",
};

function page(data: unknown[], totalPages = 1) {
  return {
    success: true,
    code: 200,
    message: "OK",
    data,
    pagination: { page: 0, size: 200, totalItems: data.length, totalPages },
  };
}

describe("project API mapping", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    delete process.env.BACKEND_API_URL;
  });

  it("maps a project with stacks and selects FR or EN", () => {
    const project = mapPortfolioProject(projectWithStacks);

    expect(project.id).toBe("geolock");
    expect(project.stacks).toEqual(["React", "PostgreSQL"]);
    expect(project.image).toBe("/api/project/image/geolock.webp");
    expect(project.links).toEqual({
      url: "https://geolock.example",
      github: "https://github.com/example/geolock",
    });
    expect(project.createdAt).toBe("2025-04-20");
    expect(project.language.fr.content).toBe("Contenu FR");

    expect(projectRecordForLocale(project, "fr")).toMatchObject({
      name: "Geolock",
      description: "Suivi de véhicules",
      imageAlt: "Aperçu Geolock",
      content: "Contenu FR",
    });
    expect(projectRecordForLocale(project, "en")).toMatchObject({
      description: "Vehicle tracking",
      imageAlt: "Geolock preview",
      content: "EN content",
    });
  });

  it("maps a project without stacks to an empty list and a fallback image", () => {
    const project = mapPortfolioProject(projectWithoutStacks);

    expect(project.stacks).toEqual([]);
    expect(project.image).toBe(PROJECT_IMAGE_FALLBACK_PATH);
    expect(project.links.github).toBeUndefined();
    expect(project.links.url).toBeUndefined();
  });

  it("keeps a same-origin image path from an absolute backend URL", () => {
    expect(
      toProjectImageSrc("http://back:8000/api/project/image/photo.webp"),
    ).toBe("/api/project/image/photo.webp");
    expect(toProjectImageSrc("https://cdn.example/other.webp")).toBe(
      PROJECT_IMAGE_FALLBACK_PATH,
    );
  });

  it("skips the data cache while developing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(page([projectWithStacks]))),
    );

    await loadPublicProjects();

    expect(fetch).toHaveBeenCalledWith(
      "http://backend.test/api/project?page=0&size=200",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("loads a valid backend page", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(page([projectWithStacks, projectWithoutStacks])),
      ),
    );

    const projects = await loadPublicProjects();

    expect(projects.map((project) => project.id)).toEqual(["geolock", "notes"]);
    expect(fetch).toHaveBeenCalledWith(
      "http://backend.test/api/project?page=0&size=200",
      expect.objectContaining({
        next: { revalidate: 300 },
      }),
    );
  });

  it("rejects an invalid backend payload", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: true, data: [] })),
    );

    await expect(loadPublicProjects()).rejects.toMatchObject({
      name: "PortfolioApiError",
      status: 502,
    });
  });

  it("rejects an HTTP error instead of returning an empty list", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 503 })),
    );

    await expect(loadPublicProjects()).rejects.toBeInstanceOf(PortfolioApiError);
    await expect(loadPublicProjects()).rejects.toMatchObject({ status: 503 });
  });

  it("returns an empty list when the backend list is empty", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          code: 200,
          message: "OK",
          data: [],
          pagination: { page: 0, size: 200, totalItems: 0, totalPages: 0 },
        }),
      ),
    );

    await expect(loadPublicProjects()).resolves.toEqual([]);
  });
});
