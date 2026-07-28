export type ExperienceLocale = 'fr' | 'en';

export interface ExperienceContractTypeLocaleInput {
  readonly title: string;
}

export interface ExperienceContractTypeInput {
  readonly fr: ExperienceContractTypeLocaleInput;
  readonly en: ExperienceContractTypeLocaleInput;
  readonly website?: string;
}

export interface ExperienceContractTypeDeleteInput {
  readonly website?: string;
}

export interface ExperienceContractTypeAdminListItem {
  readonly id: string;
  readonly slug: string;
  readonly codeFr: string;
  readonly codeEn: string;
  readonly titleFr: string;
  readonly titleEn: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deactivatedAt: string | null;
}

export interface ExperienceContractTypeAdminDetail {
  readonly id: string;
  readonly slug: string;
  readonly codeFr: string;
  readonly codeEn: string;
  readonly fr: ExperienceContractTypeLocaleInput;
  readonly en: ExperienceContractTypeLocaleInput;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
