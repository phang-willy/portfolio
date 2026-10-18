import { Localized } from '@/app/shared/models/localized.model';

export type ProjectLocale = 'fr' | 'en';

export interface ProjectLocaleInput {
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly imageAlt: string;
}

export interface ProjectInput {
  readonly slug: string;
  readonly lang: Localized<ProjectLocaleInput>;
  readonly stackIds: readonly string[];
  readonly productionLink: string;
  readonly sourceCodeLink: string;
  readonly imageLink: string;
  readonly website?: string;
}

export interface ProjectDeleteInput {
  readonly website?: string;
}

export interface ProjectAdminListLocale {
  readonly title: string;
}

export interface ProjectAdminListItem {
  readonly id: string;
  readonly slug: string;
  readonly stackNames: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deactivatedAt: string | null;
  readonly lang: Localized<ProjectAdminListLocale>;
}

export interface ProjectAdminDetail {
  readonly id: string;
  readonly slug: string;
  readonly stackIds: readonly string[];
  readonly productionLink: string | null;
  readonly sourceCodeLink: string | null;
  readonly imageLink: string | null;
  readonly lang: Localized<ProjectLocaleInput>;
  readonly githubCreatedAt: string | null;
  readonly githubUpdatedAt: string | null;
}

export interface ProjectGithubSyncResult {
  readonly checked: number;
  readonly updated: number;
}

export type { PageResponse } from '@/app/shared/models/stack.model';
