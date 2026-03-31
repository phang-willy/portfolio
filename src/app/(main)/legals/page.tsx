import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Mentions légales`,
  description:
    `${process.env.APP_TITLE} - Informations légales du site: éditeur, hébergement et conditions d'utilisation.`,
};

export default function LegalsPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Mentions légales</h1>
      <p className="mt-4 text-base text-muted-foreground">
        Cette page regroupe les informations légales du site: éditeur,
        hébergement, propriété intellectuelle et conditions d&apos;utilisation.
      </p>
    </section>
  );
}
