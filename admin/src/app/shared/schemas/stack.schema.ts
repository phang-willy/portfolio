import { z } from 'zod';

import { isSafeInlineSvg, sanitizeInlineSvg } from './inline-svg';

export { isSafeInlineSvg, sanitizeInlineSvg };

export const stackFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(255, 'Name is too long.'),
  image: z
    .string()
    .trim()
    .max(65_536, 'SVG markup is too long.')
    .refine((value) => value === '' || isSafeInlineSvg(value), {
      message: 'Paste a static inline SVG without scripts or external references.',
    }),
});

export type StackFormValue = z.infer<typeof stackFormSchema>;

export function isInlineSvgMarkup(value: string): boolean {
  return sanitizeInlineSvg(value) !== null;
}
