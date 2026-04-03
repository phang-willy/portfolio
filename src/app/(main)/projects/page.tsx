import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Projets`,
  description:
    `${process.env.APP_TITLE} - Selection de projets avec contexte, stack technique et résultats.`,
};

export default function ProjectsPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Projets</h1>
      <p className="mt-4 text-base text-muted-foreground">
        Cette page regroupe une selection de projets avec leur contexte, les
        technologies utilisées et les résultats obtenus.
      </p>
    </section>
  );
}
