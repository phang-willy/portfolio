"use client";

import Link from "next/link";
import { ProjectImage } from "@/components/project-image";
import type { Ref } from "react";
import { APPEAR_DURATION_CLASS } from "@/features/animations/constants/appear";

export type ProjectCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  /** Si défini, la carte entière est un lien vers cette URL (ex. `/projects/{id}`). */
  href?: string;
  visibilityClass: string;
  /** Délai CSS pour l’apparition en cascade (ms). */
  transitionDelayMs?: number;
  cardRef?: (node: HTMLElement | null) => void;
  dataProjectIndex?: number;
  /** Pour l’observer scroll-reveal (liste /projects). */
  dataRevealIndex?: number;
};

export function ProjectCard({
  imageSrc,
  imageAlt,
  title,
  description,
  href,
  visibilityClass,
  transitionDelayMs,
  cardRef,
  dataProjectIndex,
  dataRevealIndex,
}: ProjectCardProps) {
  const shellClass = `group relative aspect-square overflow-hidden rounded-3xl transition-all ${APPEAR_DURATION_CLASS} ease-out ${visibilityClass}`;
  const delayStyle =
    transitionDelayMs !== undefined
      ? ({ transitionDelay: `${transitionDelayMs}ms` } as const)
      : undefined;

  const inner = (
    <>
      <ProjectImage
        src={imageSrc}
        alt={imageAlt}
        width={500}
        height={500}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div className="absolute inset-0 bg-black/70 transition-colors duration-300 md:bg-black/70 group-hover:bg-black/80   group-focus-visible:bg-black/80" />
      <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 text-white opacity-100 translate-y-0 transition-all duration-300 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
        <h4 className="text-2xl font-bold leading-tight">{title}</h4>
        <p className="leading-7 text-white">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={cardRef as Ref<HTMLAnchorElement>}
        data-project-index={dataProjectIndex}
        data-reveal-index={dataRevealIndex}
        style={delayStyle}
        className={`${shellClass} block outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-main`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      ref={cardRef}
      data-project-index={dataProjectIndex}
      data-reveal-index={dataRevealIndex}
      style={delayStyle}
      className={shellClass}
    >
      {inner}
    </article>
  );
}
