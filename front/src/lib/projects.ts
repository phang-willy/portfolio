import { resolveProjectDatesFromGithub } from "@/lib/github-repo-dates";
import {
  loadPublicProjects,
  type PortfolioProject,
  type ProjectRecord,
} from "@/lib/api/projects";

export type { PortfolioProject, ProjectRecord };
export type RawProjectRecord = PortfolioProject;

async function getProjects(): Promise<PortfolioProject[]> {
  const projects = await loadPublicProjects();
  return Promise.all(
    projects.map(async (project) => {
      const { createdAt, updatedAt } = await resolveProjectDatesFromGithub(
        project.links,
        { createdAt: project.createdAt, updatedAt: project.updatedAt },
      );
      return { ...project, createdAt, updatedAt };
    }),
  );
}

export async function getProjectsByCreatedAtDesc(): Promise<PortfolioProject[]> {
  const projects = await getProjects();
  return [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProjectById(
  id: string,
): Promise<PortfolioProject | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.id === id);
}

export async function getProjectsByUpdatedAtDesc(): Promise<PortfolioProject[]> {
  const projects = await getProjects();
  return [...projects].sort((a, b) => {
    const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
    if (byUpdated !== 0) return byUpdated;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
