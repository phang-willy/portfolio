import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Contact`,
  description: `${process.env.APP_TITLE} - Contactez pour une mission, une collaboration ou un échange.`,
};

export default function ContactPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-4 text-base text-black/70 dark:text-white/70">
          Vous pouvez me contacter pour une mission, une collaboration ou
          simplement échanger autour d&apos;un projet web. Utilise le formulaire
          ci-dessous : je réponds dès que possible.
        </p>
        <p className="mt-3 text-sm text-black/60 dark:text-white/60">
          En envoyant ce formulaire, tu acceptes le traitement des données
          indiquées dans les{" "}
          <Link
            href="/legals"
            className="text-main underline-offset-2 hover:underline focus-visible:underline"
          >
            mentions légales
          </Link>
          .
        </p>
        <ContactForm className="mt-8" />
      </div>
    </section>
  );
}
