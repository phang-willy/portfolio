import projectsData from "@/data/project.json";

export type RawProjectRecord = (typeof projectsData)["projects"][number];

export type ProjectRecord = Omit<RawProjectRecord, "language"> & {
  name: string;
  description: string;
  imageAlt: string;
};

export function getProjectsByCreatedAtDesc(): Array<RawProjectRecord> {
  return [...projectsData.projects].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getProjectById(id: string): RawProjectRecord | undefined {
  return projectsData.projects.find((p) => p.id === id);
}
