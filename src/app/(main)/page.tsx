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
import experienceData from "@/data/experience.json";
import linkData from "@/data/link.json";
import projectsData from "@/data/project.json";
import serviceData from "@/data/service.json";

async function Home() {
  const githubStats = await getGithubStats();

  const socialLinks: Array<SocialLink> = [...linkData.links]
    .sort((a, b) => a.order - b.order)
    .map((link): SocialLink => ({
      href: link.url,
      label: link.label,
      icon: link.icon as SocialLink["icon"],
    }));

  const services: Array<ServiceItem> = [...serviceData.services]
    .sort((a, b) => a.order - b.order)
    .map(({ title, description }) => ({ title, description }));

  const experiences: Array<ExperienceItem> = [...experienceData.experiences]
    .sort((a, b) => Number(b.startYear) - Number(a.startYear))
    .map(({ role, company, contractType, summary, startYear, endYear }) => ({
      role,
      company,
      contractType,
      summary,
      startYear,
      endYear,
    }));

  const projects: Array<ProjectItem> = [...projectsData.projects]
    .sort((a, b) => {
      const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
      if (byUpdated !== 0) return byUpdated;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 4)
    .map((project) => ({
      imageSrc: project.image,
      imageAlt: project.imageAlt,
      title: project.name,
      description: project.description,
    }));

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
