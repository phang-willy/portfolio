const PARIS = "Europe/Paris";

export type SitemapProjectStamp = {
  githubUpdatedAt: string | null;
  updatedAt: string;
};

/** `2026-10-17T22:18:41+01:00` (heure de Paris, sans millisecondes). */
export function formatSitemapLastmod(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  let hour = value("hour");
  if (hour === "24") hour = "00";

  return `${value("year")}-${value("month")}-${value("day")}T${hour}:${value("minute")}:${value("second")}${normalizeOffset(value("timeZoneName"))}`;
}

export function projectSitemapInstant(
  project: SitemapProjectStamp,
): Date | undefined {
  const full = project.githubUpdatedAt?.trim();
  if (full) {
    return parseInstant(full);
  }
  return parseInstant(project.updatedAt);
}

/** Plus récente mise à jour parmi les projets. */
export function latestProjectUpdate(
  projects: SitemapProjectStamp[],
): Date | undefined {
  let latest: Date | undefined;
  for (const project of projects) {
    const instant = projectSitemapInstant(project);
    if (!instant) continue;
    if (!latest || instant.getTime() > latest.getTime()) {
      latest = instant;
    }
  }
  return latest;
}

function parseInstant(value: string | undefined): Date | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const offset = parisOffset(new Date(`${trimmed}T12:00:00Z`));
    const instant = new Date(`${trimmed}T00:00:00${offset}`);
    return Number.isNaN(instant.getTime()) ? undefined : instant;
  }

  const instant = new Date(trimmed);
  return Number.isNaN(instant.getTime()) ? undefined : instant;
}

function parisOffset(date: Date): string {
  if (Number.isNaN(date.getTime())) return "+01:00";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(date);
  const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return normalizeOffset(raw);
}

function normalizeOffset(raw: string): string {
  if (raw === "GMT" || raw === "UTC" || raw === "") return "+00:00";
  const match = raw.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return "+00:00";
  const hours = match[2].padStart(2, "0");
  const minutes = (match[3] ?? "00").padStart(2, "0");
  return `${match[1]}${hours}:${minutes}`;
}
