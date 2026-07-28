import { z } from 'zod';

const localeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(255, 'Title is too long.'),
});

export const experienceContractTypeFormSchema = z.object({
  fr: localeSchema,
  en: localeSchema,
});

export type ExperienceContractTypeFormValue = z.infer<typeof experienceContractTypeFormSchema>;

export type ExperienceContractTypeLocaleField = keyof z.infer<typeof localeSchema>;
