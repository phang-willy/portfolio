import type { Metadata } from "next";
import { ProjectsPageGrid } from "@/app/(main)/projects/projects-page-grid";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Projets`,
  description: `${process.env.APP_TITLE} - Venez découvrir mes projets avec leur contexte, les technologies utilisées et les résultats obtenus.`,
};

export default function ProjectsPage() {
  const projects = getProjectsByCreatedAtDesc();

  return (
    <>
      <section className="container mx-auto p-4 flex flex-col gap-8 overflow-x-clip">
        <div className="grid grid-cols-1 gap-8">
          <h1 className="text-3xl font-bold">Explorer mes projets</h1>
          <p className="text-base text-muted-foreground leading-8 max-w-xl">
            Venez découvrir mes projets avec leur contexte, les technologies
            utilisées et les résultats obtenus.
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-center text-gray-500 leading-8">
            Passer votre souris sur un projet pour en savoir plus.
          </p>
        </div>
        <ProjectsPageGrid projects={projects} />
      </section>
    </>
  );
}
