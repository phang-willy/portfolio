import type { SocialLink } from "@/app/(main)/sections/presentation-section";
import type { ExperienceItem } from "@/app/(main)/sections/experiences-section";
import type { ServiceItem } from "@/app/(main)/sections/services-section";
import type { ProjectItem } from "@/app/(main)/sections/projects-section";
import type { AppLocale } from "@/features/i18n/config/locales";
import experienceData from "@/data/experience.json";
import linkData from "@/data/link.json";
import serviceData from "@/data/service.json";
import type { ProjectRecord, RawProjectRecord } from "@/lib/projects";

type LinkEntry = (typeof linkData)["links"][number];
type ServiceEntry = (typeof serviceData)["services"][number];
type ExperienceEntry = (typeof experienceData)["experiences"][number];

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

export function experiencesForLocale(locale: AppLocale): Array<ExperienceItem> {
  return [...experienceData.experiences]
    .sort((a, b) => Number(b.startYear) - Number(a.startYear))
    .map((e) => experienceEntryToItem(e, locale));
}

function experienceEntryToItem(
  e: ExperienceEntry,
  locale: AppLocale,
): ExperienceItem {
  const tr = e.language[locale];
  return {
    role: tr.role,
    company: tr.company,
    contractType: tr.contractType,
    summary: tr.summary,
    startYear: e.startYear,
    endYear: e.endYear,
  };
}

/** Projet avec champs affichés selon la locale (même enregistrement, champs surchargés). */
export function projectRecordForLocale(
  project: RawProjectRecord,
  locale: AppLocale,
): ProjectRecord {
  const tr = project.language[locale];
  return {
    ...project,
    name: tr.name,
    description: tr.description,
    imageAlt: tr.imageAlt,
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
