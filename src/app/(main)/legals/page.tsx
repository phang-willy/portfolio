import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowUpRight } from "react-icons/lu";

export const metadata: Metadata = {
  title: `${process.env.APP_TITLE} - Mentions légales`,
  description: `${process.env.APP_TITLE} - Informations légales du site: éditeur, hébergement et conditions d'utilisation.`,
};

export default function LegalsPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 gap-8">
        <h1 className="text-3xl font-bold">Mentions légales</h1>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Directeur de la publication</h2>
          <p>PHANG Willy</p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Hébergement</h2>
          <p>Hostinger International Ltd</p>
          <p>61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Contact</h2>
          <p>
            Email:{" "}
            <Link
              href="mailto:pro.phang.willy@gmail.com"
              rel="noopener noreferrer"
              className="group text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              pro.phang.willy@gmail.com
            </Link>
          </p>
          <p>
            Téléphone:{" "}
            <Link
              href="tel:+33698259462"
              rel="noopener noreferrer"
              className="group text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              (+33) 06 98 25 94 62
            </Link>
          </p>
          <p>
            LinkedIn:{" "}
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
            Contact:{" "}
            <Link
              href="/contact"
              className="text-main hover:text-main/80 transition-colors duration-200"
            >
              Page de contact
            </Link>
          </p>
        </article>
        <article className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Données personnelles</h2>
          <p>
            Les informations transmises via le formulaire de contact (nom,
            prénom, adresse email, téléphone, entreprise, titre, message) sont
            utilisées uniquement dans le but de répondre aux demandes de
            contact.
          </p>
          <p>
            Ces données ne sont pas stockées sur le site. Elles sont transmises
            de manière sécurisée via le service{" "}
            <Link
              href="https://www.brevo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              Brevo (anciennement Sendinblue){" "}
              <LuArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-opacity duration-200 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-visible:opacity-100"
              />
            </Link>{" "}
            , utilisé pour l&apos;envoi des emails, puis reçues sur la boîte de
            messagerie de l&apos;éditeur du site.
          </p>
          <p>
            Aucune donnée personnelle n&apos;est utilisée à des fins
            commerciales ni cédée à des tiers.
          </p>
          <p>
            Les données sont conservées uniquement le temps nécessaire au
            traitement de la demande.
          </p>
          <p>
            Conformément au{" "}
            <Link
              href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center text-main hover:text-main/80 focus-visible:text-main/80 transition-colors duration-200"
            >
              <span>
                Règlement Général sur la Protection des Données (RGPD)
              </span>{" "}
              <LuArrowUpRight
                aria-hidden
                className="size-4 shrink-0 transition-opacity duration-200 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-visible:opacity-100"
              />
            </Link>
            , vous disposez d&apos;un droit d&apos;accès, de rectification et de
            suppression des données vous concernant. Vous pouvez exercer ces
            droits en contactant :{" "}
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
