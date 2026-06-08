import type { AppLocale } from "@/features/i18n/config/locales";

export function formatDateDdMmYyyy(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/** FR : JJ/MM/AAAA — EN : MM/JJ/AAAA (pages projet en anglais). */
export function formatDateForLocale(
  isoDate: string,
  locale: AppLocale,
): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  if (locale === "en") {
    return `${month}/${day}/${year}`;
  }
  return `${day}/${month}/${year}`;
}
