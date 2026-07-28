export type ExperienceLocale = 'fr' | 'en';

export interface ExperienceLocaleInput {
  readonly role: string;
  readonly summary: string;
  readonly content: string;
}

export interface ExperienceInput {
  readonly company: string;
  readonly yearStart: number;
  readonly yearEnd: number | null;
  readonly contractTypeId: string | null;
  readonly fr: ExperienceLocaleInput;
  readonly en: ExperienceLocaleInput;
  readonly website?: string;
}

export interface ExperienceDeleteInput {
  readonly website?: string;
}

export interface ExperienceAdminListItem {
  readonly id: string;
  readonly company: string;
  readonly roleFr: string;
  readonly contractTypeFr: string;
  readonly contractTypeEn: string;
  readonly yearStart: number;
  readonly yearEnd: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deactivatedAt: string | null;
}

export interface ExperienceAdminDetail {
  readonly id: string;
  readonly company: string;
  readonly yearStart: number;
  readonly yearEnd: number | null;
  readonly contractTypeId: string | null;
  readonly slugFr: string;
  readonly slugEn: string;
  readonly fr: ExperienceLocaleInput;
  readonly en: ExperienceLocaleInput;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
