import { z } from 'zod';

const localeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(160, 'Title is too long.'),
  description: z.string().trim().max(160, 'Description is too long.'),
  content: z.string().max(1_000_000, 'Content is too long.'),
  imageAlt: z.string().trim().max(255, 'Image alt is too long.'),
});

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500, 'URL is too long.')
  .refine((value) => value === '' || /^https?:\/\//i.test(value), {
    message: 'Enter a valid http(s) URL or leave empty.',
  });

export const projectFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required.')
    .max(255, 'Slug is too long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens.'),
  fr: localeSchema,
  en: localeSchema,
  stackIds: z.array(z.string().uuid()),
  productionLink: optionalUrlSchema,
  sourceCodeLink: optionalUrlSchema,
  imageLink: z.string().trim().max(500, 'Image URL is too long.'),
});

export type ProjectFormValue = z.infer<typeof projectFormSchema>;

export type ProjectLocaleField = keyof z.infer<typeof localeSchema>;
export type ProjectSharedField = 'slug' | 'productionLink' | 'sourceCodeLink' | 'imageLink';
