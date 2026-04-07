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

async function getProjectsData(): Promise<ProjectsDataFile> {
  const sourceUrl = process.env.PROJECTS_JSON_URL;
  if (!sourceUrl) return projectsData;

  try {
    const res = await fetch(sourceUrl, {
      next: { revalidate: PROJECTS_REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as unknown;
    const parsed = parseProjectsData(json);
    if (!parsed) throw new Error("Invalid projects payload");
    return parsed;
  } catch {
    return projectsData;
  }
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
