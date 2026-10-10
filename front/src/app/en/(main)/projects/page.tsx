import {
  ProjectsListPage,
  buildProjectsListMetadata,
} from "@/app/(main)/projects/projects-list-page";

export const metadata = buildProjectsListMetadata("en");

export const dynamic = "force-dynamic";

export default function Page() {
  return <ProjectsListPage locale="en" />;
}
