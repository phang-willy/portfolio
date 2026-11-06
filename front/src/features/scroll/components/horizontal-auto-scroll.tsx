"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import styles from "./horizontal-auto-scroll.module.css";

type HorizontalAutoScrollProps = {
  /** Vitesse du défilement auto (px/s). */
  speedPxPerSec?: number;
  className?: string;
  /** Deux pistes identiques : `duplicated` sert aux clés / aria-hidden. */
  children: (opts: { duplicated: boolean }) => ReactNode;
};

const getSegmentWidth = (inner: HTMLDivElement) => {
  const firstTrack = inner.children[0] as HTMLElement | undefined;
  const secondTrack = inner.children[1] as HTMLElement | undefined;
  if (!firstTrack || !secondTrack) return inner.scrollWidth / 2;
  const widthFromRects =
    secondTrack.getBoundingClientRect().left -
    firstTrack.getBoundingClientRect().left;
  if (widthFromRects > 0) return widthFromRects;
  return secondTrack.offsetLeft;
};

export const HorizontalAutoScroll = ({
  speedPxPerSec = 60,
  className,
  children,
}: HorizontalAutoScrollProps) => {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const innerTrackElement = innerRef.current;
    if (!innerTrackElement) return;

    let appliedDuration = 0;

    const applyDuration = () => {
      const segmentWidth = Math.abs(getSegmentWidth(innerTrackElement));
      if (segmentWidth <= 0) return;
      const duration = segmentWidth / speedPxPerSec;
      if (Math.abs(duration - appliedDuration) < 0.25) return;
      appliedDuration = duration;
      innerTrackElement.style.animationDuration = `${duration}s`;
    };

    applyDuration();
    const observer = new ResizeObserver(applyDuration);
    observer.observe(innerTrackElement);
    return () => observer.disconnect();
  }, [speedPxPerSec]);

  return (
    <div
      role="region"
      aria-label="Technologies - défilement horizontal"
      className={[styles.viewport, "select-none", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        ref={innerRef}
        className={`${styles.track} flex w-max items-stretch`}
      >
        {children({ duplicated: false })}
        {children({ duplicated: true })}
      </div>
    </div>
  );
};
