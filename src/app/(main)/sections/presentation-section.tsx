"use client";

import Image from "next/image";
import Link from "next/link";
import { BsFileEarmarkFill, BsGithub, BsLinkedin } from "react-icons/bs";
import type { IconType } from "react-icons";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { useCallback, useEffect, useRef, useState } from "react";

export type SocialLink = {
  href: string;
  label: string;
  icon: "github" | "linkedin" | "cv";
};

type PresentationSectionProps = {
  socialLinks: Array<SocialLink>;
};

type AnimatedBlock = "title" | "paragraph" | "image" | "links";

const APPEAR_STAGGER_MS = 400;
const APPEAR_DURATION_CLASS = "duration-[1000ms]";

const SOCIAL_ICONS: Record<SocialLink["icon"], IconType> = {
  github: BsGithub,
  linkedin: BsLinkedin,
  cv: BsFileEarmarkFill,
};

export function PresentationSection({ socialLinks }: PresentationSectionProps) {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrollDirectionRef = useRef<"up" | "down">("down");
  const pageLoadedRef = useRef(false);
  const isInViewRef = useRef(false);
  const [visibleBlocks, setVisibleBlocks] = useState<
    Record<AnimatedBlock, boolean>
  >({
    title: false,
    paragraph: false,
    image: false,
    links: false,
  });

  const clearAnimationTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  const runSequence = useCallback(() => {
    clearAnimationTimeouts();

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const orderedBlocks: Array<AnimatedBlock> = isDesktop
      ? ["title", "links", "image", "paragraph"] // Mobile first
      : ["title", "paragraph", "image", "links"];

    const sequence =
      scrollDirectionRef.current === "up"
        ? [...orderedBlocks].reverse()
        : orderedBlocks;

    setVisibleBlocks({
      title: false,
      paragraph: false,
      image: false,
      links: false,
    });

    sequence.forEach((block, index) => {
      const timeoutId = setTimeout(() => {
        setVisibleBlocks((previous) => ({ ...previous, [block]: true }));
      }, index * APPEAR_STAGGER_MS);
      timeoutsRef.current.push(timeoutId);
    });
  }, [clearAnimationTimeouts]);

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
          setVisibleBlocks({
            title: false,
            paragraph: false,
            image: false,
            links: false,
          });
          return;
        }

        if (pageLoadedRef.current) runSequence();
      },
      { threshold: 0.25 },
    );

    observer.observe(sectionElement);
    return () => {
      observer.disconnect();
      clearAnimationTimeouts();
    };
  }, [clearAnimationTimeouts, runSequence]);

  return (
    <section
      ref={sectionRef}
      id="presentation"
      className="container mx-auto p-4 relative flex flex-col gap-2 md:h-[calc(100vh-128px)] overflow-x-clip"
    >
      <div className="flex grow flex-col gap-8 pt-2 md:grid md:h-full md:grid-cols-4 md:grid-rows-2 md:gap-x-8 md:gap-y-6 md:pt-8 xl:pt-8 xl:gap-x-8 xl:gap-y-6">
        <div
          className={`order-1 md:col-span-3 md:col-start-1 md:row-start-1 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleBlocks.title
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <h1 className="text-5xl xl:text-[10rem] uppercase w-full whitespace-nowrap font-bold">
            <span className="sr-only">PHANG Willy</span>
            <div className="flex flex-col gap-2">
              <span>{t.presentation.titleLine1}</span>
              <span>{t.presentation.titleLine2}</span>
            </div>
          </h1>
        </div>

        <div
          className={`order-2 font-bold text-left md:col-start-4 md:row-start-2 md:self-end md:text-right transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleBlocks.paragraph
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8 md:translate-x-8"
          }`}
        >
          <p>{t.presentation.greeting1}</p>
          <p>{t.presentation.greeting2}</p>
        </div>

        <div
          className={`order-3 md:col-start-4 md:row-start-1 md:justify-self-end transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleBlocks.image
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-8"
          }`}
        >
          <div className="relative aspect-square w-full max-w-[350px] md:aspect-auto md:h-[350px] md:w-[350px] md:shrink-0">
            <Image
              src="/profile.webp"
              alt={t.presentation.profileImageAlt}
              fill
              priority
              sizes="(max-width: 768px) min(100vw, 350px), 350px"
              className="rounded-4xl object-cover"
            />
          </div>
        </div>

        <div
          className={`order-4 md:col-span-3 md:col-start-1 md:row-start-2 md:self-end transition-all ${APPEAR_DURATION_CLASS} ease-out ${
            visibleBlocks.links
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-8"
          }`}
        >
          <ul className="mt-2 grid grid-cols-4 gap-4 md:mt-0 md:grid-cols-12 md:gap-6">
            {socialLinks.map((socialLink) => {
              const Icon = SOCIAL_ICONS[socialLink.icon];
              return (
                <li key={socialLink.label} className="col-span-1 md:col-span-2">
                  <Link
                    href={socialLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={
                      socialLink.href.startsWith("http") ||
                      socialLink.href.endsWith(".pdf")
                        ? false
                        : undefined
                    }
                    className="flex items-center gap-2 bg-main hover:bg-main/80 transition-colors duration-200 text-white md:px-4 md:py-2 rounded-md aspect-square md:aspect-auto"
                    aria-label={socialLink.label}
                  >
                    <Icon className="h-8 w-8 md:w-6 md:h-6 mx-auto md:mx-0" />
                    <span className="hidden md:inline">{socialLink.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
