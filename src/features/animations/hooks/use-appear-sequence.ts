"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseAppearSequenceArgs = {
  sectionRef: React.RefObject<HTMLElement | null>;
  keys: Array<string>;
  desktopOrder: Array<string>;
  mobileOrder: Array<string>;
  staggerMs: number;
  threshold?: number;
};

function buildVisibilityMap(keys: Array<string>, isVisible: boolean) {
  return keys.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = isVisible;
    return acc;
  }, {});
}

export function useAppearSequence({
  sectionRef,
  keys,
  desktopOrder,
  mobileOrder,
  staggerMs,
  threshold = 0.2,
}: UseAppearSequenceArgs) {
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrollDirectionRef = useRef<"up" | "down">("down");
  const pageLoadedRef = useRef(false);
  const isInViewRef = useRef(false);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>(
    () => buildVisibilityMap(keys, false),
  );

  const clearAnimationTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    setVisibleMap(buildVisibilityMap(keys, false));
  }, [keys]);

  const runSequence = useCallback(() => {
    clearAnimationTimeouts();

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const baseOrder = isDesktop ? desktopOrder : mobileOrder;
    const sequence =
      scrollDirectionRef.current === "up" ? [...baseOrder].reverse() : baseOrder;

    setVisibleMap(buildVisibilityMap(keys, false));

    sequence.forEach((key, index) => {
      const timeoutId = setTimeout(() => {
        setVisibleMap((previous) => ({ ...previous, [key]: true }));
      }, index * staggerMs);
      timeoutsRef.current.push(timeoutId);
    });
  }, [clearAnimationTimeouts, desktopOrder, keys, mobileOrder, staggerMs]);

  useEffect(() => {
    if (document.readyState === "complete") {
      pageLoadedRef.current = true;
      if (isInViewRef.current) {
        const timeoutId = setTimeout(() => runSequence(), 0);
        timeoutsRef.current.push(timeoutId);
      }
      return;
    }

    const handleWindowLoad = () => {
      pageLoadedRef.current = true;
      if (isInViewRef.current) runSequence();
    };

    window.addEventListener("load", handleWindowLoad, { once: true });
    return () => window.removeEventListener("load", handleWindowLoad);
  }, [runSequence]);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > previousScrollY) scrollDirectionRef.current = "down";
      if (currentScrollY < previousScrollY) scrollDirectionRef.current = "up";
      previousScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = Boolean(entry?.isIntersecting);
        isInViewRef.current = isIntersecting;

        if (!isIntersecting) {
          clearAnimationTimeouts();
          setVisibleMap(buildVisibilityMap(keys, false));
          return;
        }

        if (pageLoadedRef.current) runSequence();
      },
      { threshold },
    );

    observer.observe(sectionElement);
    return () => {
      observer.disconnect();
      clearAnimationTimeouts();
    };
  }, [clearAnimationTimeouts, keys, runSequence, sectionRef, threshold]);

  return visibleMap;
}
