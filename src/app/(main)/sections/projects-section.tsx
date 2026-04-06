"use client";

import Link from "next/link";
import { ProjectCard } from "@/app/(main)/sections/project-card";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { LuArrowRight } from "react-icons/lu";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  APPEAR_DURATION_CLASS,
  APPEAR_STAGGER_MS,
  APPEAR_THRESHOLD,
} from "@/features/animations/constants/appear";
import { useAppearSequence } from "@/features/animations/hooks/use-appear-sequence";

export type ProjectItem = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
};

type ProjectsSectionProps = {
  projects: Array<ProjectItem>;
};

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const { locale, t } = useI18n();
  const projectsHref = buildLocalizedPathname("/projects", locale);
  const sectionRef = useRef<HTMLElement>(null);
  const projectCardRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleProjectCards, setVisibleProjectCards] = useState<
    Record<number, boolean>
  >({});

  const orderedBlocks = useMemo(
    () => ["heading", "title", "description", "hover-hint"],
    [],
  );

  const visibleMap = useAppearSequence({
    sectionRef,
    keys: orderedBlocks,
    desktopOrder: orderedBlocks,
    mobileOrder: orderedBlocks,
    staggerMs: APPEAR_STAGGER_MS,
    threshold: APPEAR_THRESHOLD,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleProjectCards((previous) => {
          const next = { ...previous };
          for (const entry of entries) {
            const indexAttr = (entry.target as HTMLElement).dataset
              .projectIndex;
            if (!indexAttr) continue;
            const index = Number(indexAttr);
            next[index] = entry.isIntersecting;
          }
          return next;
        });
      },
      { threshold: 0.35 },
    );

    for (const element of projectCardRefs.current) {
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [projects]);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="container mx-auto p-4 flex flex-col gap-8 overflow-x-clip"
    >
      <div className="grid grid-cols-1 gap-8">
        <div
          className={`flex flex-col gap-8 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleMap.heading
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <h2>
            <span className="border-3 border-main px-6 py-3 rounded-full">
              {t.projects.badge}
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 justify-between items-baseline gap-8">
          <h3
            className={`text-5xl font-bold leading-tight transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.title
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.projects.title}
          </h3>
          <p
            className={`text-lg text-gray-500 leading-8 max-w-xl justify-self-end transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.description
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.projects.description}
          </p>
        </div>
      </div>
      <div
        className={`hidden md:block transition-opacity duration-300 ${
          visibleMap["hover-hint"] ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-center text-gray-500 leading-8">
          {t.projects.hoverHint}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.title}
            imageSrc={project.imageSrc}
            imageAlt={project.imageAlt}
            title={project.title}
            description={project.description}
            cardRef={(node) => {
              projectCardRefs.current[index] = node;
            }}
            dataProjectIndex={index}
            visibilityClass={
              visibleProjectCards[index]
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }
          />
        ))}
      </div>
      <footer className="flex justify-center">
        <Link
          href={projectsHref}
          className="group bg-main text-white px-8 py-4 rounded-full hover:bg-main/80 focus:bg-main/80 transition-colors duration-200 flex items-center gap-8 w-auto"
        >
          <LuArrowRight className="w-8 h-8 transition-transform duration-200 group-hover:translate-x-1 group-focus:translate-x-1" />
          <span>{t.projects.seeAll}</span>
        </Link>
      </footer>
    </section>
  );
}
