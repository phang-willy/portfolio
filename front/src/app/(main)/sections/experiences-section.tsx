"use client";

import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { useEffect, useRef, useState } from "react";
import {
  APPEAR_DURATION_CLASS,
  APPEAR_STAGGER_MS,
  APPEAR_THRESHOLD,
} from "@/features/animations/constants/appear";
import { useAppearSequence } from "@/features/animations/hooks/use-appear-sequence";

export type ExperienceItem = {
  role: string;
  company: string;
  contractType: string;
  summary: string;
  startYear: string;
  endYear: string;
};

type ExperiencesSectionProps = {
  experiences: Array<ExperienceItem>;
};

export function ExperiencesSection({ experiences }: ExperiencesSectionProps) {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const experienceCardRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleExperienceCards, setVisibleExperienceCards] = useState<
    Record<number, boolean>
  >({});

  const visibleMap = useAppearSequence({
    sectionRef,
    keys: ["heading", "title", "description"],
    desktopOrder: ["heading", "title", "description"],
    mobileOrder: ["heading", "title", "description"],
    staggerMs: APPEAR_STAGGER_MS,
    threshold: APPEAR_THRESHOLD,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleExperienceCards((previous) => {
          const next = { ...previous };
          for (const entry of entries) {
            const indexAttr = (entry.target as HTMLElement).dataset
              .experienceIndex;
            if (!indexAttr) continue;
            const index = Number(indexAttr);
            next[index] = entry.isIntersecting;
          }
          return next;
        });
      },
      { threshold: 0.35 },
    );

    for (const element of experienceCardRefs.current) {
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [experiences]);

  return (
    <section
      ref={sectionRef}
      id="experiences"
      aria-labelledby="experiences-heading"
      className="bg-gray-100 dark:bg-gray-900 py-16 grid grid-cols-1 gap-16 overflow-x-clip"
    >
      <div
        className={`container mx-auto p-4 grid grid-cols-1 gap-8 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
          visibleMap.heading
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-8"
        }`}
      >
        <div className="flex flex-col gap-8">
          <h2 id="experiences-heading">
            <span className="bg-main transition-colors duration-200 text-white px-6 py-3 rounded-full">
              {t.experiences.badge}
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 justify-between gap-8 items-baseline">
          <h3
            className={`text-5xl font-bold leading-tight transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.title
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.experiences.title}
          </h3>
          <p
            className={`text-lg text-gray-500 leading-8 max-w-xl xl:justify-self-end transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.description
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.experiences.description}
          </p>
        </div>
      </div>
      <div>
        {experiences.map((experience, index) => (
          <article
            key={`${experience.company}-${experience.startYear}-${experience.endYear}`}
            ref={(node) => {
              experienceCardRefs.current[index] = node;
            }}
            data-experience-index={index}
            className="transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 px-4 py-8 container mx-auto items-center transition-all ${APPEAR_DURATION_CLASS} ease-out ${
                visibleExperienceCards[index]
                  ? "opacity-100 translate-x-0"
                  : index % 2 === 0
                    ? "opacity-0 -translate-x-8"
                    : "opacity-0 translate-x-8"
              } ${index !== experiences.length - 1 ? "border-b" : ""}`}
            >
              <div className="order-2 md:order-1 flex flex-col gap-4">
                <h4 className="text-2xl font-bold leading-tight">
                  {experience.role}
                </h4>
                <div className="text-gray-500 flex flex-col gap-2">
                  <p className="flex items-center gap-1">
                    <span>{experience.company}</span>
                    <span>-</span>
                    <span>{experience.contractType}</span>
                  </p>
                  <p>{experience.summary}</p>
                </div>
              </div>
              <div className="order-1 md:order-2 flex flex-row gap-2 text-4xl md:text-6xl font-semibold uppercase md:justify-end items-center tracking-tight">
                <span>{experience.startYear}</span>
                <span>-</span>
                <span>{experience.endYear}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
