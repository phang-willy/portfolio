"use client";

import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { useRef } from "react";
import { GithubAnimatedStats } from "@/features/github/components/github-animated-stats";
import { ParisMap } from "@/features/map/components/paris-map";
import {
  APPEAR_DURATION_CLASS,
  APPEAR_STAGGER_MS,
  APPEAR_THRESHOLD,
} from "@/features/animations/constants/appear";
import { useAppearSequence } from "@/features/animations/hooks/use-appear-sequence";

type AboutSectionProps = {
  contributions: number | null;
  repositories: number | null;
};

export function AboutSection({
  contributions,
  repositories,
}: AboutSectionProps) {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const visibleMap = useAppearSequence({
    sectionRef,
    keys: ["heading", "text", "map"],
    desktopOrder: ["heading", "text", "map"],
    mobileOrder: ["heading", "text", "map"],
    staggerMs: APPEAR_STAGGER_MS,
    threshold: APPEAR_THRESHOLD,
  });

  return (
    <section
      ref={sectionRef}
      id="about"
      className="container mx-auto p-4 grid grid-cols-1 gap-8 overflow-x-clip"
    >
      <div className="flex flex-col gap-8">
        <h2>
          <span
            className={`border-3 border-main px-6 py-3 rounded-full transition-all ${APPEAR_DURATION_CLASS} ease-out inline-block ${
              visibleMap.heading
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.about.badge}
          </span>
        </h2>
        <div
          className={`transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleMap.text
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <p className="text-lg xl:text-3xl leading-10">{t.about.line1}</p>
          <p className="text-lg xl:text-3xl leading-10">{t.about.line2}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div
          className={`md:col-span-9 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleMap.map
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <ParisMap />
        </div>
        <div className="md:col-span-3 grid grid-cols-1 gap-4">
          <GithubAnimatedStats
            contributions={contributions}
            repositories={repositories}
            labels={t.githubStats}
          />
        </div>
      </div>
    </section>
  );
}
