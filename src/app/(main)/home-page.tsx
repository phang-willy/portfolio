import { AboutSection } from "@/app/(main)/sections/about-section";
import { ExperiencesSection } from "@/app/(main)/sections/experiences-section";
import { MessageSection } from "@/app/(main)/sections/message-section";
import {
  PresentationSection,
  type SocialLink,
} from "@/app/(main)/sections/presentation-section";
import { ProjectsSection } from "@/app/(main)/sections/projects-section";
import { ServicesSection } from "@/app/(main)/sections/services-section";
import { StacksSection } from "@/app/(main)/sections/stacks-section";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import {
  experiencesForLocale,
  projectItemsForLocale,
  servicesForLocale,
  socialLinksForLocale,
} from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import projectsData from "@/data/project.json";
import { getGithubStats } from "@/lib/github-stats";
import type { Metadata } from "next";

export function buildHomeMetadata(locale: AppLocale): Metadata {
  const d = getDictionary(locale);
  return {
    title: `${process.env.APP_TITLE} - ${d.meta.homeTitle}`,
    description: `${process.env.APP_TITLE} - ${d.meta.homeDescription}`,
    openGraph: {
      title: `${process.env.APP_TITLE} - ${d.meta.homeTitle}`,
      description: `${process.env.APP_TITLE} - ${d.meta.homeDescription}`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export async function HomePage({ locale }: { locale: AppLocale }) {
  const githubStats = await getGithubStats();

  const socialLinks: Array<SocialLink> = socialLinksForLocale(locale);

  const services = servicesForLocale(locale);

  const experiences = experiencesForLocale(locale);

  const sortedProjects = [...projectsData.projects].sort((a, b) => {
    const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
    if (byUpdated !== 0) return byUpdated;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const projects = projectItemsForLocale(sortedProjects.slice(0, 4), locale);

  return (
    <>
      <PresentationSection socialLinks={socialLinks} />
      <StacksSection />
      <AboutSection
        contributions={githubStats?.contributionsAllTime ?? null}
        repositories={githubStats?.repositoriesAffiliated ?? null}
        currentStreak={githubStats?.currentStreakDays ?? null}
        longestStreak={githubStats?.longestStreakDays ?? null}
      />
      <ServicesSection services={services} />
      <ExperiencesSection experiences={experiences} />
      <ProjectsSection projects={projects} />
      <MessageSection />
    </>
  );
}
