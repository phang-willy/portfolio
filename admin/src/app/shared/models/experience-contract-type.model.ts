import { Localized } from '@/app/shared/models/localized.model';

export type ExperienceLocale = 'fr' | 'en';

export interface ExperienceContractTypeLocaleInput {
  readonly title: string;
}

export interface ExperienceContractTypeInput {
  readonly lang: Localized<ExperienceContractTypeLocaleInput>;
  readonly website?: string;
}

export interface ExperienceContractTypeDeleteInput {
  readonly website?: string;
}

export interface ExperienceContractTypeAdminLocale {
  readonly code: string;
  readonly title: string;
}

export interface ExperienceContractTypeAdminListItem {
  readonly id: string;
  readonly slug: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deactivatedAt: string | null;
  readonly lang: Localized<ExperienceContractTypeAdminLocale>;
}

export interface ExperienceContractTypeAdminDetail {
  readonly id: string;
  readonly slug: string;
  readonly lang: Localized<ExperienceContractTypeAdminLocale>;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
