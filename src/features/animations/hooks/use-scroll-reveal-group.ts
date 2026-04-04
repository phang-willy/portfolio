"use client";

import { APPEAR_DURATION_CLASS, PROJECT_CARD_STAGGER_MS } from "@/features/animations/constants/appear";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type BlockAnimState = {
  visible: boolean;
  entryFromBottom: boolean;
};

const IO_THRESHOLD = 0;
const IO_ROOT_MARGIN = "0px 0px 72px 0px";
const HIDE_DEBOUNCE_MS = 160;

const REVEAL_ATTR = "data-reveal-index";

export function useScrollRevealGroup(blockCount: number) {
  const blockRefs = useRef<Array<HTMLElement | null>>([]);
  const hideTimeoutsRef = useRef<
    Record<number, ReturnType<typeof setTimeout>>
  >({});
  const scrollYHistory = useRef({ prev: 0, current: 0 });
  const [blockState, setBlockState] = useState<Record<number, BlockAnimState>>(
    {},
  );

  useEffect(() => {
    scrollYHistory.current = {
      prev: window.scrollY,
      current: window.scrollY,
    };

    const onScroll = () => {
      scrollYHistory.current = {
        prev: scrollYHistory.current.current,
        current: window.scrollY,
      };
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const clearHideTimeout = (index: number) => {
      const t = hideTimeoutsRef.current[index];
      if (t !== undefined) {
        clearTimeout(t);
        delete hideTimeoutsRef.current[index];
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const raw = entry.target.getAttribute(REVEAL_ATTR);
          const index = raw !== null ? Number(raw) : NaN;
          if (Number.isNaN(index)) continue;

          if (entry.isIntersecting) {
            clearHideTimeout(index);
            const { prev, current } = scrollYHistory.current;
            const scrollDown = current >= prev;
            setBlockState((s) => ({
              ...s,
              [index]: {
                visible: true,
                entryFromBottom: scrollDown,
              },
            }));
          } else {
            clearHideTimeout(index);
            hideTimeoutsRef.current[index] = setTimeout(() => {
              setBlockState((s) => ({
                ...s,
                [index]: {
                  visible: false,
                  entryFromBottom: s[index]?.entryFromBottom ?? true,
                },
              }));
              delete hideTimeoutsRef.current[index];
            }, HIDE_DEBOUNCE_MS);
          }
        }
      },
      {
        threshold: IO_THRESHOLD,
        rootMargin: IO_ROOT_MARGIN,
      },
    );

    for (let i = 0; i < blockCount; i++) {
      const element = blockRefs.current[i];
      if (element) observer.observe(element);
    }

    return () => {
      for (const t of Object.values(hideTimeoutsRef.current)) {
        clearTimeout(t);
      }
      hideTimeoutsRef.current = {};
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [blockCount]);

  const setBlockRef = (index: number) => (node: HTMLElement | null) => {
    blockRefs.current[index] = node;
  };

  const getVisibilityClass = useCallback(
    (index: number) => {
      const state = blockState[index];
      const visible = state?.visible ?? false;
      const entryFromBottom = state?.entryFromBottom ?? true;
      const hiddenClass = entryFromBottom
        ? "opacity-0 translate-y-8"
        : "opacity-0 -translate-y-8";
      const visibleClass = "opacity-100 translate-y-0";
      return visible ? visibleClass : hiddenClass;
    },
    [blockState],
  );

  const getTransitionDelayMs = useCallback(
    (index: number) => {
      const state = blockState[index];
      const visible = state?.visible ?? false;
      const entryFromBottom = state?.entryFromBottom ?? true;
      if (!visible) return 0;
      const staggerIndex = entryFromBottom
        ? index
        : blockCount - 1 - index;
      return staggerIndex * PROJECT_CARD_STAGGER_MS;
    },
    [blockCount, blockState],
  );

  const getBlockStyle = useCallback(
    (index: number): CSSProperties | undefined => {
      const ms = getTransitionDelayMs(index);
      return ms > 0 ? { transitionDelay: `${ms}ms` } : undefined;
    },
    [getTransitionDelayMs],
  );

  const getBlockShellClassName = useCallback(
    (index: number, extraClassName?: string) => {
      const base = `transition-all ${APPEAR_DURATION_CLASS} ease-out ${getVisibilityClass(index)}`;
      return extraClassName ? `${base} ${extraClassName}` : base;
    },
    [getVisibilityClass],
  );

  return {
    setBlockRef,
    getVisibilityClass,
    getTransitionDelayMs,
    getBlockStyle,
    getBlockShellClassName,
  };
}
