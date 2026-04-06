import {
  ProjectsListPage,
  buildProjectsListMetadata,
} from "@/app/(main)/projects/projects-list-page";

export const metadata = buildProjectsListMetadata("en");

export default function Page() {
  return <ProjectsListPage locale="en" />;
}
