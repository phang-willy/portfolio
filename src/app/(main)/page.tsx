import { getGithubStats } from "@/lib/github-stats";
import {
  PresentationSection,
  type SocialLink,
} from "@/app/(main)/sections/presentation-section";
import { StacksSection } from "@/app/(main)/sections/stacks-section";
import { AboutSection } from "@/app/(main)/sections/about-section";
import {
  ServicesSection,
  type ServiceItem,
} from "@/app/(main)/sections/services-section";
import {
  ExperiencesSection,
  type ExperienceItem,
} from "@/app/(main)/sections/experiences-section";
import {
  ProjectsSection,
  type ProjectItem,
} from "@/app/(main)/sections/projects-section";
import { MessageSection } from "@/app/(main)/sections/message-section";

async function Home() {
  const githubLogin = process.env.GITHUB_USERNAME?.trim() ?? "phang-willy";
  const githubStats = await getGithubStats();

  const socialLinks: Array<SocialLink> = [
    {
      href: `https://github.com/${githubLogin}`,
      label: "GitHub",
      icon: "github",
    },
    {
      href: "https://linkedin.com/in/phang-willy",
      label: "LinkedIn",
      icon: "linkedin",
    },
    { href: "/CV-PHANG-Willy.pdf", label: "CV", icon: "cv" },
  ];

  const services: Array<ServiceItem> = [
    {
      title: "Développement Full Stack",
      description:
        "Je conçois et développe des applications web et mobile robustes, de l'architecture backend à l'expérience utilisateur, avec un fort focus sur la performance et la maintenabilité.",
    },
    {
      title: "Développement FrontEnd",
      description:
        "Je crée des interfaces modernes, accessibles et réactives, pensées pour offrir une expérience utilisateur fluide et cohérente sur tous les appareils.",
    },
    {
      title: "Développement BackEnd",
      description:
        "Je développe des APIs et services backend fiables, sécurisés et évolutifs, conçus pour supporter la croissance produit et des intégrations durables.",
    },
    {
      title: "Développement E-commerce",
      description:
        "Je conçois et optimise des boutiques en ligne sur WordPress/WooCommerce et Shopify, avec des parcours d'achat fluides, des thèmes sur mesure et des intégrations adaptées à vos objectifs business.",
    },
  ];

  const experiences: Array<ExperienceItem> = [
    {
      role: "Développeur Full Stack",
      company: "DIT",
      contractType: "Contrat en Alternance",
      summary: "Développement d'applications de créances et de refurbushing",
      startYear: "2023",
      endYear: "2025",
    },
    {
      role: "Développeur WordPress/WooCommerce",
      company: "DIT",
      contractType: "Contrat en Alternance",
      summary:
        "Développement WordPress/WooCommerce d'événements annuels de conférences et de formations dentaires",
      startYear: "2022",
      endYear: "2023",
    },
    {
      role: "Intégrateur Web et Webmaster",
      company: "Logistib",
      contractType: "Contrat en Alternance",
      summary:
        "Intégration de sites web et création de thèmes WordPress/WooCommerce, Shopify et Prestashop",
      startYear: "2020",
      endYear: "2022",
    },
  ];

  const projects: Array<ProjectItem> = [
    {
      imageSrc: "/project/twitch-watchlist.webp",
      imageAlt: "Extension Chrome - Twitch Watchlist",
      title: "Extension Chrome - Twitch Watchlist",
      description:
        "Une Extension Chrome permettant de gérer sa liste de watchlist sur Twitch, avec une interface moderne et intuitive.",
    },
  ];

  return (
    <>
      <PresentationSection socialLinks={socialLinks} />
      <StacksSection />
      <AboutSection
        contributions={githubStats?.contributionsAllTime ?? null}
        repositories={githubStats?.repositoriesAffiliated ?? null}
      />
      <ServicesSection services={services} />
      <ExperiencesSection experiences={experiences} />
      <ProjectsSection projects={projects} />
      <MessageSection />
    </>
  );
}

export default Home;
