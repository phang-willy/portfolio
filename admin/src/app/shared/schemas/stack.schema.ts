import { z } from 'zod';

const SVG_MARKUP_PATTERN = /<svg[\s>]/i;
const DANGEROUS_SVG_PATTERN =
  /<\s*\/?\s*(script|foreignobject|iframe|object|embed|link|meta|image|style)\b|javascript\s*:|data\s*:\s*text\/html|(?:^|[\s/])on[a-z]+\s*=|href\s*=\s*['"]\s*(?:https?:|\/\/)|url\s*\(\s*(?!#)/i;

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
    .refine((value) => value === '' || isSafeInlineSvg(value), {
      message: 'Paste a static inline SVG without scripts or external references.',
    }),
});

export type StackFormValue = z.infer<typeof stackFormSchema>;

export function isInlineSvgMarkup(value: string): boolean {
  return SVG_MARKUP_PATTERN.test(value.trim());
}

export function isSafeInlineSvg(value: string): boolean {
  const markup = value.trim();
  return isInlineSvgMarkup(markup) && !DANGEROUS_SVG_PATTERN.test(markup);
}
