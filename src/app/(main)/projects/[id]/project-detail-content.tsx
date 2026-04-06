"use client";

import Link from "next/link";
import { LuArrowLeft, LuExternalLink } from "react-icons/lu";
import { useMemo } from "react";
import { ProjectImage } from "@/components/project-image";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { buildLocalizedPathname } from "@/features/i18n/lib/pathname-locale";
import { useScrollRevealGroup } from "@/features/animations/hooks/use-scroll-reveal-group";
import { formatDateForLocale } from "@/lib/date-format";
import type { ProjectRecord } from "@/lib/projects";

type ProjectDetailContentProps = {
  project: ProjectRecord;
};

export function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const { locale, t } = useI18n();
  const projectsIndexHref = buildLocalizedPathname("/projects", locale);
  const collatorLocale = locale === "en" ? "en" : "fr";

  const externalUrl = project.links.url;
  const githubUrl = project.links.github;

  const sortedStacks = useMemo(
    () =>
      [...project.stacks].sort((a, b) =>
        a.localeCompare(b, collatorLocale, { sensitivity: "base" }),
      ),
    [collatorLocale, project.stacks],
  );

  const stacksCount = sortedStacks.length;
  const linkCount = (externalUrl ? 1 : 0) + (githubUrl ? 1 : 0);

  /** 0 back, 1 thumb, 2 name, 3 titre Stacks, 4.. chips, +1 titre Liens, +links, +info */
  const blockCount = 6 + stacksCount + linkCount;

  const { setBlockRef, getBlockShellClassName, getBlockStyle } =
    useScrollRevealGroup(blockCount);

  const idxStacksHeading = 3;
  const idxStackChip = (i: number) => 4 + i;
  const idxLinksHeading = 4 + stacksCount;
  const baseLinkItems = 5 + stacksCount;
  const idxLinkExternal = externalUrl ? baseLinkItems : -1;
  const idxLinkGithub = githubUrl ? baseLinkItems + (externalUrl ? 1 : 0) : -1;
  const idxInfo = 5 + stacksCount + linkCount;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-10">
        <section
          id="back-to-projects"
          ref={setBlockRef(0)}
          style={getBlockStyle(0)}
          className={getBlockShellClassName(0)}
          data-reveal-index={0}
        >
          <Link
            href={projectsIndexHref}
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full transition-colors w-fit bg-main hover:bg-main/80 focus-visible:bg-main/80"
          >
            <LuArrowLeft className="size-4" aria-hidden />
            {t.projectDetail.backToProjects}
          </Link>
        </section>

        <section
          id="thumbnail"
          ref={setBlockRef(1)}
          style={getBlockStyle(1)}
          className={getBlockShellClassName(
            1,
            "relative h-[50vh] w-full overflow-hidden rounded-3xl bg-gray-200",
          )}
          data-reveal-index={1}
        >
          <ProjectImage
            src={project.image}
            alt={project.imageAlt}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, min(100vw, 1200px)"
            className="object-contain"
          />
          <div className="absolute inset-0 bg-black/35 rounded-3xl" />
        </section>

        <section
          id="name"
          ref={setBlockRef(2)}
          style={getBlockStyle(2)}
          className={getBlockShellClassName(2, "grid grid-cols-1 gap-4")}
          data-reveal-index={2}
        >
          <h1 className="text-3xl font-bold leading-tight">{project.name}</h1>
          <p className="text-lg text-muted-foreground leading-8">
            {project.description}
          </p>
        </section>

        <section id="stacks" className="grid grid-cols-1 gap-4">
          <div
            ref={setBlockRef(idxStacksHeading)}
            style={getBlockStyle(idxStacksHeading)}
            className={getBlockShellClassName(idxStacksHeading)}
            data-reveal-index={idxStacksHeading}
          >
            <h2 className="text-xl font-semibold">{t.projectDetail.stacks}</h2>
          </div>
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {sortedStacks.map((stack, i) => (
              <li
                key={stack}
                ref={setBlockRef(idxStackChip(i))}
                style={getBlockStyle(idxStackChip(i))}
                className={getBlockShellClassName(
                  idxStackChip(i),
                  "rounded-full border border-main/30 bg-main/5 px-4 py-1.5 text-sm",
                )}
                data-reveal-index={idxStackChip(i)}
              >
                {stack}
              </li>
            ))}
          </ul>
        </section>

        <section id="links" className="grid grid-cols-1 gap-4">
          <div
            ref={setBlockRef(idxLinksHeading)}
            style={getBlockStyle(idxLinksHeading)}
            className={getBlockShellClassName(idxLinksHeading)}
            data-reveal-index={idxLinksHeading}
          >
            <h2 className="text-xl font-semibold">{t.projectDetail.links}</h2>
          </div>
          <ul className="flex list-none flex-col gap-2 p-0 sm:flex-row sm:flex-wrap sm:gap-6">
            {externalUrl ? (
              <li
                ref={setBlockRef(idxLinkExternal)}
                style={getBlockStyle(idxLinkExternal)}
                className={getBlockShellClassName(idxLinkExternal)}
                data-reveal-index={idxLinkExternal}
              >
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-main hover:text-main/80 focus-visible:text-main/80 transition-colors"
                >
                  <span>{t.projectDetail.siteDemo}</span>
                  <LuExternalLink className="size-4" aria-hidden />
                </a>
              </li>
            ) : null}
            {githubUrl ? (
              <li
                ref={setBlockRef(idxLinkGithub)}
                style={getBlockStyle(idxLinkGithub)}
                className={getBlockShellClassName(idxLinkGithub)}
                data-reveal-index={idxLinkGithub}
              >
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-main hover:text-main/80 focus-visible:text-main/80 transition-colors"
                >
                  <span>{t.projectDetail.sourceCode}</span>
                  <LuExternalLink className="size-4" aria-hidden />
                </a>
              </li>
            ) : null}
          </ul>
        </section>

        <section
          id="information"
          ref={setBlockRef(idxInfo)}
          style={getBlockStyle(idxInfo)}
          className={getBlockShellClassName(idxInfo, "grid grid-cols-1 gap-4")}
          data-reveal-index={idxInfo}
        >
          <h2 className="text-xl font-semibold">
            {t.projectDetail.information}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {t.projectDetail.created}{" "}
              {formatDateForLocale(project.createdAt, locale)}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.projectDetail.updated}{" "}
              {formatDateForLocale(project.updatedAt, locale)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
