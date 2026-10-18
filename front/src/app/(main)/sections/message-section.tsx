"use client";

import Image from "next/image";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { LuQuote } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import { APPEAR_DURATION_CLASS } from "@/features/animations/constants/appear";

export function MessageSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollDirectionRef = useRef<"up" | "down">("down");
  const [isVisible, setIsVisible] = useState(false);
  const [iconShouldPulse, setIconShouldPulse] = useState(false);
  const [imageFromTop, setImageFromTop] = useState(true);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > previousScrollY) scrollDirectionRef.current = "down";
      if (currentScrollY < previousScrollY) scrollDirectionRef.current = "up";
      previousScrollY = currentScrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersects = Boolean(entry?.isIntersecting);
        setIsVisible(intersects);
        if (!intersects) {
          setIconShouldPulse(false);
          return;
        }

        const fromTop = scrollDirectionRef.current === "down";
        setImageFromTop(fromTop);
        setIconShouldPulse(fromTop);
      },
      { threshold: 0.3 },
    );
    observer.observe(sectionElement);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="message"
      aria-label={t.message.sectionAriaLabel}
      className="bg-gray-100 dark:bg-gray-900 py-20 overflow-x-clip"
    >
      <div className="container mx-auto p-4">
        <div className="mx-auto max-w-4xl text-center flex flex-col gap-10">
          <div className="text-7xl leading-none text-gray-300 select-none">
            <LuQuote
              className={`mx-auto h-16 w-16 ${
                iconShouldPulse ? "animate-pulse" : ""
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col gap-8 text-gray-500 dark:text-gray-300">
            <p
              className={`text-lg md:text-2xl leading-relaxed italic word-break-words transition-all ${APPEAR_DURATION_CLASS} ease-out ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              {t.message.quote1a}
              <br />
              {t.message.quote1b}
            </p>
            <p
              className={`text-lg md:text-2xl leading-relaxed italic word-break-words transition-all ${APPEAR_DURATION_CLASS} ease-out ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              }`}
            >
              {t.message.quote2}
            </p>
            <p
              className={`text-lg md:text-2xl leading-relaxed italic word-break-words transition-all ${APPEAR_DURATION_CLASS} ease-out ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              {t.message.quote3}
            </p>
          </div>
          <div className="mx-auto h-px w-full max-w-2xl bg-gray-300" />
          <div
            className={`flex items-center justify-center gap-4 transition-all ${APPEAR_DURATION_CLASS} ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : imageFromTop
                  ? "opacity-0 -translate-y-6"
                  : "opacity-0 translate-y-6"
            }`}
          >
            <span className="relative block size-16 shrink-0 overflow-hidden rounded-full">
              <Image
                src="/profile.webp"
                alt={t.message.profileAlt}
                fill
                sizes="64px"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
            </span>
            <div className="text-left">
              <p className="text-xl font-semibold">{t.message.name}</p>
              <p className="text-sm text-gray-500">{t.message.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
