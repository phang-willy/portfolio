import projectsData from "@/data/project.json";

export type ProjectRecord = (typeof projectsData)["projects"][number];

export function getProjectsByCreatedAtDesc(): Array<ProjectRecord> {
  return [...projectsData.projects].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getProjectById(id: string): ProjectRecord | undefined {
  return projectsData.projects.find((p) => p.id === id);
}
