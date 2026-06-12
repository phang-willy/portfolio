import { z } from 'zod';

const SVG_MARKUP_PATTERN = /<svg[\s>]/i;

export const stackFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(255, 'Name is too long.'),
  image: z
    .string()
    .trim()
    .max(65_536, 'SVG markup is too long.')
    .refine((value) => value === '' || SVG_MARKUP_PATTERN.test(value), {
      message: 'Paste inline SVG markup (must contain an <svg> element).',
    }),
});

export type StackFormValue = z.infer<typeof stackFormSchema>;

export function isInlineSvgMarkup(value: string): boolean {
  return SVG_MARKUP_PATTERN.test(value.trim());
}
