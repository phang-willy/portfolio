import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { getRequestLocale } from "@/features/i18n/lib/request-locale";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowUpRight } from "react-icons/lu";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const d = getDictionary(locale);
  return {
    title: `${process.env.APP_TITLE} - ${d.meta.legalsTitle}`,
    description: `${process.env.APP_TITLE} - ${d.meta.legalsDescription}`,
    openGraph: {
      title: `${process.env.APP_TITLE} - ${d.meta.legalsTitle}`,
      description: `${process.env.APP_TITLE} - ${d.meta.legalsDescription}`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export default async function LegalsPage() {
  const locale = await getRequestLocale();
  const d = getDictionary(locale);
  const t = d.legals;
  const contactHref = buildLocalizedPathname("/contact", locale);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-8">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t.publicationDirector}</h2>
          <p>PHANG Willy</p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t.hosting}</h2>
          <p>Hostinger International Ltd</p>
          <p>61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t.contact}</h2>
          <p>
            {t.emailLabel}{" "}
            <Link
              href="mailto:pro.phang.willy@gmail.com"
              rel="noopener noreferrer"
              className="group text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              pro.phang.willy@gmail.com
            </Link>
          </p>
          <p>
            {t.phoneLabel}{" "}
            <Link
              href="tel:+33698259462"
              rel="noopener noreferrer"
              className="group text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              (+33) 06 98 25 94 62
            </Link>
          </p>
          <p>
            {t.linkedInLabel}{" "}
            <Link
              href="https://www.linkedin.com/in/phang-willy/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              Phang Willy{" "}
              <LuArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-opacity duration-200 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-visible:opacity-100"
              />
            </Link>
          </p>
          <p>
            {t.contactLinkPrefix}{" "}
            <Link
              href={contactHref}
              className="text-main hover:text-main/80 transition-colors duration-200"
            >
              {t.contactPageLink}
            </Link>
          </p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t.cookies}</h2>
          <p>{t.cookiesBody}</p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">{t.personalData}</h2>
          <p>{t.pData1}</p>
          <p>
            {t.pData2Lead}{" "}
            <Link
              href="https://www.brevo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              {t.pData2Brevo}{" "}
              <LuArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-opacity duration-200 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-visible:opacity-100"
              />
            </Link>
            {t.pData2Trail}
          </p>
          <p>{t.pData3}</p>
          <p>{t.pData4}</p>
          <p>
            {t.pData5Lead}{" "}
            <Link
              href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              <span>{t.gdpr}</span>{" "}
              <LuArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-opacity duration-200 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-visible:opacity-100"
              />
            </Link>
            {t.pData5Trail}{" "}
            <Link
              href="mailto:pro.phang.willy@gmail.com"
              rel="noopener noreferrer"
              className="group text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              pro.phang.willy@gmail.com
            </Link>
          </p>
        </article>
      </div>
    </section>
  );
}
