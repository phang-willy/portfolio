import {
  ProjectsListPage,
  buildProjectsListMetadata,
} from "@/app/(main)/projects/projects-list-page";

export const metadata = buildProjectsListMetadata("fr");

export default function Page() {
  return <ProjectsListPage locale="fr" />;
}
