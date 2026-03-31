import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Contact`,
  description:
    `${process.env.APP_TITLE} - Contactez pour une mission, une collaboration ou un échange.`,
};

export default function ContactPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-4 text-base text-muted-foreground">
        Tu peux me contacter pour une mission, une collaboration ou simplement
        échanger autour d&apos;un projet web.
      </p>
    </section>
  );
}
