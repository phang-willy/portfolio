"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Évite les faux positifs du type `/environnement`. */
function pathnameImpliesEnglish(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/en" || pathname.startsWith("/en/");
}

export type HttpErrorLocale = "fr" | "en";

function defaultTitle(status: number, locale: HttpErrorLocale): string {
  const en = locale === "en";
  if (status === 404) return en ? "Page not found" : "Page introuvable";
  if (status >= 500) return en ? "Server error" : "Erreur serveur";
  if (status >= 400)
    return en ? "Request cannot be completed" : "Requête impossible";
  if (status >= 300 && status < 400) return en ? "Redirect" : "Redirection";
  return en ? "Error" : "Erreur";
}

function defaultMessage(status: number, locale: HttpErrorLocale): string {
  const en = locale === "en";
  if (status === 404) {
    return en
      ? "The page you're looking for doesn't exist."
      : "La page demandée n'existe pas.";
  }
  if (status >= 500) {
    return en
      ? "Something went wrong on our end. Please try again."
      : "Une erreur technique est survenue. Veuillez réessayer.";
  }
  if (status >= 400) {
    return en
      ? "The request could not be processed."
      : "La requête n'a pas pu être traitée.";
  }
  if (status >= 300 && status < 400) {
    return en
      ? "You were redirected. If this wasn't expected, go back home."
      : "Vous avez été redirigé. Si ce n'est pas attendu, retournez à l'accueil.";
  }
  return en
    ? "An unexpected error occurred."
    : "Une erreur inattendue est survenue.";
}

function homeHref(locale: HttpErrorLocale): string {
  return locale === "en" ? "/en" : "/";
}

const linkBtnBase =
  "inline-flex items-center justify-center rounded-md cursor-pointer transition-colors duration-200 px-4 py-2 text-base";

const linkPrimaryClass = `${linkBtnBase} bg-main text-white hover:opacity-90`;

export type HttpErrorViewProps = {
  status: number;
  title?: string;
  message?: string;
  locale?: HttpErrorLocale;
};

export function HttpErrorView({
  status,
  title,
  message,
  locale: localeProp,
}: HttpErrorViewProps) {
  const pathname = usePathname();
  const locale: HttpErrorLocale =
    localeProp ?? (pathnameImpliesEnglish(pathname) ? "en" : "fr");

  const resolvedTitle = title ?? defaultTitle(status, locale);
  const resolvedMessage = message ?? defaultMessage(status, locale);
  const home = homeHref(locale);
  const labelHome = locale === "en" ? "Back to home" : "Retour à l'accueil";
  const labelBack = locale === "en" ? "Previous page" : "Page précédente";

  return (
    <div className="flex min-h-[70vh] w-full flex-1 items-center justify-center p-4 xl:p-8">
      <article className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-white text-sm shadow-sm dark:border-border-dark dark:bg-dark-500">
        <header className="grid gap-1 px-4 pt-4 pb-2">
          <p className="text-muted-foreground font-mono text-7xl font-bold tabular-nums">
            {status}
          </p>
          <h1 className="font-oswald text-2xl">{resolvedTitle}</h1>
        </header>
        <section className="px-4 pb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {resolvedMessage}
          </p>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-border bg-gray-50 p-4 dark:border-border-dark dark:bg-black/20">
          <Link href={home} className={linkPrimaryClass}>
            {labelHome}
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              }
            }}
          >
            {labelBack}
          </Button>
        </footer>
      </article>
    </div>
  );
}
