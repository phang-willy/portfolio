"use client";

import { useI18n } from "@/features/i18n/hooks/use-i18n";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { GithubAnimatedStats } from "@/features/github/components/github-animated-stats";
import {
  APPEAR_DURATION_CLASS,
  APPEAR_STAGGER_MS,
  APPEAR_THRESHOLD,
} from "@/features/animations/constants/appear";
import { useAppearSequence } from "@/features/animations/hooks/use-appear-sequence";

const ParisMap = dynamic(
  () =>
    import("@/features/map/components/paris-map").then((mod) => mod.ParisMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(50vh,420px)] w-full animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800 md:h-[min(55vh,480px)]"
        aria-hidden
      />
    ),
  },
);

type AboutSectionProps = {
  contributions: number | null;
  repositories: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
};

export function AboutSection({
  contributions,
  repositories,
  currentStreak,
  longestStreak,
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
      aria-labelledby="about-heading"
      className="container mx-auto p-4 grid grid-cols-1 gap-8 overflow-x-clip"
    >
      <div className="flex flex-col gap-8">
        <h2 id="about-heading">
          <span
            className={`bg-main transition-colors duration-200 text-white px-6 py-3 rounded-full ${APPEAR_DURATION_CLASS} ease-out inline-block ${
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
          className={`col-span-12 xl:col-span-8 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleMap.map
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <ParisMap />
        </div>
        <div className="col-span-12 xl:col-span-4 grid grid-cols-1 gap-4">
          <GithubAnimatedStats
            contributions={contributions}
            repositories={repositories}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            labels={t.githubStats}
          />
        </div>
      </div>
    </section>
  );
}
