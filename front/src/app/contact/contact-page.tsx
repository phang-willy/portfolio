import { ContactForm } from "@/components/contact/contact-form";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { appName } from "@/lib/app-name";
import type { Metadata } from "next";
import Link from "next/link";

export function buildContactMetadata(locale: AppLocale): Metadata {
  const d = getDictionary(locale);
  return {
    title: `${appName} - ${d.contact.metaTitle}`,
    description: `${appName} - ${d.contact.metaDescription}`,
    openGraph: {
      title: `${appName} - ${d.contact.metaTitle}`,
      description: `${appName} - ${d.contact.metaDescription}`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export function ContactPage({ locale }: { locale: AppLocale }) {
  const d = getDictionary(locale);
  const legalsHref = buildLocalizedPathname("/legals", locale);

  return (
    <section
      className="container mx-auto px-4 py-10"
      aria-labelledby="contact-page-title"
    >
      <div className="mx-auto max-w-2xl">
        <h1 id="contact-page-title" className="text-3xl font-bold">
          {d.contact.title}
        </h1>
        <p className="mt-4 text-base text-black/70 dark:text-white/70">
          {d.contact.intro}
        </p>
        <p className="mt-3 text-sm text-black/60 dark:text-white/60">
          {d.contact.legalLeadIn}{" "}
          <Link
            href={legalsHref}
            className="text-main underline-offset-2 hover:underline focus-visible:underline"
          >
            {d.contact.legalLink}
          </Link>
          {d.contact.legalSuffix}
        </p>
        <ContactForm className="mt-8" />
      </div>
    </section>
  );
}
