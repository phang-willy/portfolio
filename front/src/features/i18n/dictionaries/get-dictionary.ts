import type { AppLocale } from "@/features/i18n/config/locales";
import { en } from "@/features/i18n/dictionaries/en";
import type { Dictionary } from "@/features/i18n/dictionaries/fr";
import { fr } from "@/features/i18n/dictionaries/fr";

const dictionaries: Record<AppLocale, Dictionary> = {
  fr,
  en,
};

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
