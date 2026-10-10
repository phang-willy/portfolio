import { z } from 'zod';

const localeSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1, 'Role is required.')
    .max(255, 'Role is too long.'),
  summary: z.string().trim().max(500, 'Summary is too long.'),
  content: z.string().max(1_000_000, 'Content is too long.'),
});

const yearSchema = z.coerce
  .number({ error: 'Year is required.' })
  .int('Year must be a whole number.')
  .min(1900, 'Year is too small.')
  .max(2100, 'Year is too large.');

export const experienceFormSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(1, 'Company is required.')
      .max(255, 'Company is too long.'),
    yearStart: yearSchema,
    yearEnd: z.union([yearSchema, z.null()]),
    contractTypeId: z.union([z.string().uuid(), z.null()]),
    fr: localeSchema,
    en: localeSchema,
  })
  .refine(
    (value) => value.yearEnd === null || value.yearEnd >= value.yearStart,
    {
      message: 'Year end must be greater than or equal to year start.',
      path: ['yearEnd'],
    },
  );

export type ExperienceFormValue = z.infer<typeof experienceFormSchema>;

export type ExperienceLocaleField = keyof z.infer<typeof localeSchema>;
export type ExperienceSharedField = 'company' | 'yearStart' | 'yearEnd' | 'contractTypeId';
