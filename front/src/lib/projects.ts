import { resolveProjectDatesFromGithub } from "@/lib/github-repo-dates";
import projectsData from "@/data/project.json";

export type RawProjectRecord = (typeof projectsData)["projects"][number];

export type ProjectRecord = Omit<RawProjectRecord, "language"> & {
  name: string;
  description: string;
  imageAlt: string;
};

type ProjectsDataFile = { projects: Array<RawProjectRecord> };

const PROJECTS_REVALIDATE_SECONDS = 300;

function parseProjectsData(payload: unknown): ProjectsDataFile | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { projects?: unknown };
  if (!Array.isArray(data.projects)) return null;
  return { projects: data.projects as Array<RawProjectRecord> };
}

async function enrichProjectsWithGithubDates(
  projects: Array<RawProjectRecord>,
): Promise<Array<RawProjectRecord>> {
  return Promise.all(
    projects.map(async (p) => {
      const { createdAt, updatedAt } = await resolveProjectDatesFromGithub(
        p.links,
        { createdAt: p.createdAt, updatedAt: p.updatedAt },
      );
      return { ...p, createdAt, updatedAt };
    }),
  );
}

async function getProjectsData(): Promise<ProjectsDataFile> {
  const sourceUrl = process.env.PROJECTS_JSON_URL;
  let base: ProjectsDataFile;
  if (!sourceUrl) {
    base = projectsData;
  } else {
    try {
      const res = await fetch(sourceUrl, {
        next: { revalidate: PROJECTS_REVALIDATE_SECONDS },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      const parsed = parseProjectsData(json);
      if (!parsed) throw new Error("Invalid projects payload");
      base = parsed;
    } catch {
      base = projectsData;
    }
  }

  const projects = await enrichProjectsWithGithubDates(base.projects);
  return { projects };
}

export async function getProjectsByCreatedAtDesc(): Promise<Array<RawProjectRecord>> {
  const data = await getProjectsData();
  return [...data.projects].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getProjectById(
  id: string,
): Promise<RawProjectRecord | undefined> {
  const data = await getProjectsData();
  return data.projects.find((p) => p.id === id);
}

export async function getProjectsByUpdatedAtDesc(): Promise<Array<RawProjectRecord>> {
  const data = await getProjectsData();
  return [...data.projects].sort((a, b) => {
    const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
    if (byUpdated !== 0) return byUpdated;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
