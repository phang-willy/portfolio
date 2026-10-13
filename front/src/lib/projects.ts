import {
  loadPublicProjects,
  type PortfolioProject,
  type ProjectRecord,
} from "@/lib/api/projects";

export type { PortfolioProject, ProjectRecord };
export type RawProjectRecord = PortfolioProject;

async function getProjects(): Promise<PortfolioProject[]> {
  return loadPublicProjects();
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

/** Newest GitHub update first. Projects without a GitHub date stay at the end. */
export function compareByGithubUpdatedAtDesc(
  a: PortfolioProject,
  b: PortfolioProject,
): number {
  const left = a.githubUpdatedAt;
  const right = b.githubUpdatedAt;
  if (left && right && left !== right) {
    return right.localeCompare(left);
  }
  if (left && !right) return -1;
  if (!left && right) return 1;
  const byCreated = b.createdAt.localeCompare(a.createdAt);
  if (byCreated !== 0) return byCreated;
  return a.id.localeCompare(b.id);
}

export async function getProjectsByUpdatedAtDesc(): Promise<PortfolioProject[]> {
  const projects = await getProjects();
  return [...projects].sort(compareByGithubUpdatedAtDesc);
}
