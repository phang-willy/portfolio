import { Localized } from '@/app/shared/models/localized.model';

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
  readonly lang: Localized<ExperienceLocaleInput>;
  readonly website?: string;
}

export interface ExperienceDeleteInput {
  readonly website?: string;
}

export interface ExperienceAdminListLocale {
  readonly role: string;
  readonly contractType: string;
}

export interface ExperienceAdminListItem {
  readonly id: string;
  readonly company: string;
  readonly yearStart: number;
  readonly yearEnd: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deactivatedAt: string | null;
  readonly lang: Localized<ExperienceAdminListLocale>;
}

export interface ExperienceAdminDetailLocale {
  readonly slug: string;
  readonly role: string;
  readonly summary: string;
  readonly content: string;
}

export interface ExperienceAdminDetail {
  readonly id: string;
  readonly company: string;
  readonly yearStart: number;
  readonly yearEnd: number | null;
  readonly contractTypeId: string | null;
  readonly lang: Localized<ExperienceAdminDetailLocale>;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
