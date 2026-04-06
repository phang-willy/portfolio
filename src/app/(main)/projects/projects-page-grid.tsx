"use client";

import { ProjectCard } from "@/app/(main)/sections/project-card";
import { useScrollRevealGroup } from "@/features/animations/hooks/use-scroll-reveal-group";
import type { ProjectRecord } from "@/lib/projects";

type ProjectsPageGridProps = {
  projects: Array<ProjectRecord>;
};

export function ProjectsPageGrid({ projects }: ProjectsPageGridProps) {
  const { setBlockRef, getVisibilityClass, getTransitionDelayMs } =
    useScrollRevealGroup(projects.length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          href={`/projects/${project.id}`}
          imageSrc={project.image}
          imageAlt={project.imageAlt}
          title={project.name}
          description={project.description}
          dataProjectIndex={index}
          dataRevealIndex={index}
          cardRef={setBlockRef(index)}
          transitionDelayMs={getTransitionDelayMs(index)}
          visibilityClass={getVisibilityClass(index)}
        />
      ))}
    </div>
  );
}
