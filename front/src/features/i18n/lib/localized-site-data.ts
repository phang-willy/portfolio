import type { SocialLink } from "@/app/(main)/sections/presentation-section";
import type { ExperienceItem } from "@/app/(main)/sections/experiences-section";
import type { ServiceItem } from "@/app/(main)/sections/services-section";
import type { ProjectItem } from "@/app/(main)/sections/projects-section";
import type { AppLocale } from "@/features/i18n/config/locales";
import type { PortfolioExperience } from "@/lib/api/experiences";
import linkData from "@/data/link.json";
import serviceData from "@/data/service.json";
import type { ProjectRecord, RawProjectRecord } from "@/lib/projects";

type LinkEntry = (typeof linkData)["links"][number];
type ServiceEntry = (typeof serviceData)["services"][number];

function pickUrl(link: LinkEntry, locale: AppLocale): string {
  return link.language[locale].url;
}

function pickLabel(link: LinkEntry, locale: AppLocale): string {
  return link.language[locale].label;
}

export function socialLinksForLocale(locale: AppLocale): Array<SocialLink> {
  return [...linkData.links]
    .sort((a, b) => a.order - b.order)
    .map(
      (link): SocialLink => ({
        href: pickUrl(link, locale),
        label: pickLabel(link, locale),
        icon: link.icon as SocialLink["icon"],
      }),
    );
}

export function servicesForLocale(locale: AppLocale): Array<ServiceItem> {
  return [...serviceData.services]
    .sort((a, b) => a.order - b.order)
    .map((s) => serviceEntryToItem(s, locale));
}

function serviceEntryToItem(s: ServiceEntry, locale: AppLocale): ServiceItem {
  return {
    title: s.language[locale].title,
    description: s.language[locale].description,
  };
}

export function experienceItemsForLocale(
  experiences: Array<PortfolioExperience>,
  locale: AppLocale,
): Array<ExperienceItem> {
  return experiences.map((experience) =>
    experienceItemForLocale(experience, locale),
  );
}

export function experienceItemForLocale(
  experience: PortfolioExperience,
  locale: AppLocale,
): ExperienceItem {
  const preferred = experience.language[locale];
  const fallback =
    locale === "fr" ? experience.language.en : experience.language.fr;
  const localized = preferred.role.trim() ? preferred : fallback;

  return {
    id: experience.id,
    role: localized.role,
    company: experience.company,
    contractType: localized.contractType,
    summary: localized.summary,
    startYear: String(experience.yearStart),
    endYear: experience.yearEnd == null ? "" : String(experience.yearEnd),
  };
}

/** Projet avec champs affichés selon la locale (même enregistrement, champs surchargés). */
export function projectRecordForLocale(
  project: RawProjectRecord,
  locale: AppLocale,
): ProjectRecord {
  const preferred = project.language[locale];
  const fallback =
    locale === "fr" ? project.language.en : project.language.fr;
  const tr = preferred.name.trim() ? preferred : fallback;
  return {
    id: project.id,
    image: project.image,
    links: project.links,
    stacks: project.stacks,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    name: tr.name,
    description: tr.description,
    imageAlt: tr.imageAlt,
    content: tr.content,
  };
}

export function projectItemsForLocale(
  projects: Array<RawProjectRecord>,
  locale: AppLocale,
): Array<ProjectItem> {
  return projects.map((project) => {
    const view = projectRecordForLocale(project, locale);
    return {
      id: project.id,
      imageSrc: view.image,
      imageAlt: view.imageAlt,
      title: view.name,
      description: view.description,
    };
  });
}
