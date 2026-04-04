"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type HorizontalAutoScrollProps = {
  /** Vitesse du défilement auto (px/s). */
  speedPxPerSec?: number;
  /** Après interaction, reprise du défilement auto après ce délai (ms). */
  resumeDelayMs?: number;
  className?: string;
  /** Deux pistes identiques : `duplicated` sert aux clés / aria-hidden. */
  children: (opts: { duplicated: boolean }) => ReactNode;
};

const getSegmentWidth = (inner: HTMLDivElement) => {
  const firstTrack = inner.children[0] as HTMLElement | undefined;
  const secondTrack = inner.children[1] as HTMLElement | undefined;
  if (!firstTrack || !secondTrack) return inner.scrollWidth / 2;
  const firstTrackRect = firstTrack.getBoundingClientRect();
  const secondTrackRect = secondTrack.getBoundingClientRect();
  const widthFromRects = secondTrackRect.left - firstTrackRect.left;
  if (widthFromRects > 0) return widthFromRects;
  return secondTrack.offsetLeft;
};

export const HorizontalAutoScroll = ({
  speedPxPerSec = 42,
  resumeDelayMs = 2200,
  className,
  children,
}: HorizontalAutoScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const dragPointerId = useRef<number | null>(null);
  const startClientX = useRef(0);
  const startScrollLeft = useRef(0);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
      resumeTimerRef.current = null;
    }, resumeDelayMs);
  }, [clearResumeTimer, resumeDelayMs]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    clearResumeTimer();
  }, [clearResumeTimer]);

  const endDrag = useCallback(
    (pointerId: number) => {
      const containerElement = containerRef.current;
      if (!containerElement) return;
      dragPointerId.current = null;
      try {
        containerElement.releasePointerCapture(pointerId);
      } catch {
        // ignore
      }
      scheduleResume();
    },
    [scheduleResume],
  );

  useEffect(() => {
    const containerElement = containerRef.current;
    const innerTrackElement = innerRef.current;
    if (!containerElement || !innerTrackElement) return;

    lastTsRef.current = performance.now();

    const animateFrame = (timestampMs: number) => {
      const deltaSeconds = Math.min(
        (timestampMs - lastTsRef.current) / 1000,
        0.05,
      );
      lastTsRef.current = timestampMs;

      const isMouseDragging = dragPointerId.current !== null;
      if (
        !pausedRef.current &&
        !isMouseDragging &&
        innerTrackElement.scrollWidth > containerElement.clientWidth
      ) {
        const singleTrackWidth = getSegmentWidth(innerTrackElement);
        if (singleTrackWidth > 0) {
          containerElement.scrollLeft += speedPxPerSec * deltaSeconds;
          if (containerElement.scrollLeft >= singleTrackWidth - 0.5) {
            containerElement.scrollLeft -= singleTrackWidth;
          }
        }
      }

      rafRef.current = requestAnimationFrame(animateFrame);
    };

    rafRef.current = requestAnimationFrame(animateFrame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearResumeTimer();
    };
  }, [clearResumeTimer, speedPxPerSec]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    pause();

    const containerElement = containerRef.current;
    if (!containerElement) return;

    if (e.pointerType === "touch") return;

    dragPointerId.current = e.pointerId;
    startClientX.current = e.clientX;
    startScrollLeft.current = containerElement.scrollLeft;
    containerElement.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const containerElement = containerRef.current;
    if (!containerElement || dragPointerId.current !== e.pointerId) return;
    const deltaX = e.clientX - startClientX.current;
    containerElement.scrollLeft = startScrollLeft.current - deltaX;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current === e.pointerId) {
      endDrag(e.pointerId);
    } else {
      scheduleResume();
    }
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current === e.pointerId) {
      endDrag(e.pointerId);
    }
  };

  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragPointerId.current === e.pointerId) {
      dragPointerId.current = null;
      scheduleResume();
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const horizontalIntent =
      e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horizontalIntent) return;
    pause();
    scheduleResume();
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Technologies — défilement horizontal"
      onWheel={onWheel}
      className={[
        "overflow-x-hidden overflow-y-hidden overscroll-x-contain",
        "touch-pan-x [-webkit-overflow-scrolling:touch]",
        "cursor-grab active:cursor-grabbing",
        "select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
    >
      <div ref={innerRef} className="flex w-max items-stretch">
        {children({ duplicated: false })}
        {children({ duplicated: true })}
      </div>
    </div>
  );
};
