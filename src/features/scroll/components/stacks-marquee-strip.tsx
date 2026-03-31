"use client";

import { BsGithub } from "react-icons/bs";
import {
  SiDocker,
  SiFigma,
  SiJavascript,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { HorizontalAutoScroll } from "@/features/scroll/components/horizontal-auto-scroll";

const stacks = [
  { name: "Docker", icon: SiDocker },
  { name: "Next.js", icon: SiNextdotjs },
  { name: "React", icon: SiReact },
  { name: "TypeScript", icon: SiTypescript },
  { name: "JavaScript", icon: SiJavascript },
  { name: "Tailwind", icon: SiTailwindcss },
  { name: "Node.js", icon: SiNodedotjs },
  { name: "NestJS", icon: SiNestjs },
  { name: "PostgreSQL", icon: SiPostgresql },
  { name: "GitHub", icon: BsGithub },
  { name: "Figma", icon: SiFigma },
] as const;

export const StacksMarqueeStrip = () => {
  return (
    <HorizontalAutoScroll
      className="mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] py-6"
      speedPxPerSec={42}
      resumeDelayMs={2200}
    >
      {({ duplicated }) => (
        <ul
          className="flex w-max items-center gap-4 px-2"
          aria-hidden={duplicated}
        >
          {stacks.map((stack) => {
            const Icon = stack.icon;
            return (
              <li
                key={duplicated ? `${stack.name}-dup` : stack.name}
                className="flex shrink-0 items-center gap-2 rounded-full border px-8 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:text-main dark:text-white"
              >
                <Icon className="h-5 w-5" />
                <span>{stack.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </HorizontalAutoScroll>
  );
};
