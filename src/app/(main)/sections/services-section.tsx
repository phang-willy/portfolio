"use client";

import Link from "next/link";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { LuArrowRight } from "react-icons/lu";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  APPEAR_DURATION_CLASS,
  APPEAR_STAGGER_MS,
  APPEAR_THRESHOLD,
} from "@/features/animations/constants/appear";
import { useAppearSequence } from "@/features/animations/hooks/use-appear-sequence";

export type ServiceItem = {
  title: string;
  description: string;
};

type ServicesSectionProps = {
  services: Array<ServiceItem>;
};

export function ServicesSection({ services }: ServicesSectionProps) {
  const { locale, t } = useI18n();
  const contactHref = buildLocalizedPathname("/contact", locale);
  const sectionRef = useRef<HTMLElement>(null);
  const serviceCardRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleServiceCards, setVisibleServiceCards] = useState<
    Record<number, boolean>
  >({});

  const orderedBlocks = useMemo(
    () => ["heading", "description", "contact-button"],
    [],
  );

  const visibleMap = useAppearSequence({
    sectionRef,
    keys: orderedBlocks,
    desktopOrder: orderedBlocks,
    mobileOrder: orderedBlocks,
    staggerMs: APPEAR_STAGGER_MS,
    threshold: APPEAR_THRESHOLD,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleServiceCards((previous) => {
          const next = { ...previous };
          for (const entry of entries) {
            const indexAttr = (entry.target as HTMLElement).dataset
              .serviceIndex;
            if (!indexAttr) continue;
            const index = Number(indexAttr);
            next[index] = entry.isIntersecting;
          }
          return next;
        });
      },
      { threshold: 0.35 },
    );

    for (const element of serviceCardRefs.current) {
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [services]);

  return (
    <section
      ref={sectionRef}
      id="services"
      aria-labelledby="services-heading"
      className="container mx-auto p-4 grid grid-cols-1 gap-8 overflow-x-clip"
    >
      <div
        className={`flex flex-col gap-8 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
          visibleMap.heading
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-8"
        }`}
      >
        <h2 id="services-heading">
          <span className="bg-main transition-colors duration-200 text-white px-6 py-3 rounded-full">
            {t.services.badge}
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="md:col-span-6 xl:col-span-5 flex flex-col gap-8">
          <h2
            className={`text-5xl font-bold leading-14 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.heading
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <span>{t.services.titleLine1}</span>
            <br />
            <span>{t.services.titleLine2}</span>
          </h2>
          <p
            className={`text-lg text-gray-500 leading-8 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap.description
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            {t.services.intro}
          </p>
          <div
            className={`transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              visibleMap["contact-button"]
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
          >
            <Link
              href={contactHref}
              className="bg-main text-white px-8 py-4 rounded-full hover:bg-main/80 focus:bg-main/80 transition-colors duration-200 w-full md:w-auto block"
            >
              {t.services.contactCta}
            </Link>
          </div>
        </div>
        <div className="md:col-span-6 xl:col-span-7">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <article
                key={service.title}
                ref={(node) => {
                  serviceCardRefs.current[index] = node;
                }}
                data-service-index={index}
                className={`border rounded-lg p-8 flex flex-col justify-between gap-8 h-full transition-all ${APPEAR_DURATION_CLASS} ease-out ${
                  visibleServiceCards[index]
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                }`}
                style={{ minHeight: 0 }}
              >
                <div className="flex flex-col gap-8 flex-1">
                  <span className="w-1/5 h-0.5 border bg-border"></span>
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                  <p className="text-lg leading-8">{service.description}</p>
                </div>
                <Link
                  href={contactHref}
                  className="group bg-main text-white px-8 py-4 rounded-full hover:bg-main/80 focus:bg-main/80 transition-colors duration-200 flex items-center gap-8 w-auto"
                >
                  <LuArrowRight
                    className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-focus:translate-x-1"
                    aria-hidden
                  />
                  <span className="text-left leading-snug">
                    {t.services.learnMoreForService.replace(
                      "{service}",
                      service.title,
                    )}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
