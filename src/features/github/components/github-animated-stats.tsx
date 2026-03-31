"use client";

import { useEffect, useRef, useState } from "react";
import { APPEAR_DURATION_CLASS } from "@/features/animations/constants/appear";

type GithubAnimatedStatsProps = {
  contributions: number | null;
  repositories: number | null;
};

function useAnimatedCount(
  targetValue: number | null,
  shouldAnimate: boolean,
  durationMs = 1400,
) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === null) return;
    if (!shouldAnimate) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animationStartTime = performance.now();
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

    const runAnimationFrame = (now: number) => {
      const elapsedMs = now - animationStartTime;
      const animationProgress = Math.min(1, elapsedMs / durationMs);
      setAnimatedValue(
        Math.round(targetValue * easeOutCubic(animationProgress)),
      );
      if (animationProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(runAnimationFrame);
      } else {
        setAnimatedValue(targetValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(runAnimationFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [shouldAnimate, targetValue, durationMs]);

  return targetValue === null ? null : animatedValue;
}

function StatBlock({
  label,
  targetValue,
  isInViewport,
  fromLeft,
}: {
  label: string;
  targetValue: number | null;
  isInViewport: boolean;
  fromLeft: boolean;
}) {
  const animatedValue = useAnimatedCount(targetValue, isInViewport);
  const showPlaceholder = targetValue === null;

  return (
    <article
      className={`flex flex-col gap-2 border rounded-lg p-4 h-full justify-center transition-all ${APPEAR_DURATION_CLASS} ease-out ${
        isInViewport
          ? "opacity-100 translate-x-0"
          : fromLeft
            ? "opacity-0 -translate-x-8"
            : "opacity-0 translate-x-8"
      }`}
    >
      <p className="text-5xl font-bold tabular-nums">
        {showPlaceholder ? (
          <span className="text-gray-600">—</span>
        ) : (
          <>
            <span>+</span>
            <span>{isInViewport ? (animatedValue ?? 0) : 0}</span>
          </>
        )}
      </p>
      <p className="text-sm text-gray-400">{label}</p>
    </article>
  );
}

export function GithubAnimatedStats({
  contributions,
  repositories,
}: GithubAnimatedStatsProps) {
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleCards, setVisibleCards] = useState<Record<number, boolean>>({});
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateScreen = () => setIsDesktop(mediaQuery.matches);
    updateScreen();
    mediaQuery.addEventListener("change", updateScreen);
    return () => mediaQuery.removeEventListener("change", updateScreen);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleCards((previous) => {
          const next = { ...previous };
          for (const entry of entries) {
            const indexAttr = (entry.target as HTMLElement).dataset.statIndex;
            if (!indexAttr) continue;
            const index = Number(indexAttr);
            next[index] = entry.isIntersecting;
          }
          return next;
        });
      },
      { threshold: 0.45 },
    );

    for (const element of cardRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-16 items-center justify-center">
      {[
        {
          label: "Contributions sur GitHub",
          targetValue: contributions,
        },
        {
          label: "Repositories (création & collaboration)",
          targetValue: repositories,
        },
      ].map((stat, index) => (
        <div
          key={stat.label}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          data-stat-index={index}
        >
          <StatBlock
            label={stat.label}
            targetValue={stat.targetValue}
            isInViewport={Boolean(visibleCards[index])}
            fromLeft={isDesktop ? false : index % 2 === 0}
          />
        </div>
      ))}
    </div>
  );
}
