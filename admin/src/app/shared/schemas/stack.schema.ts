import { z } from 'zod';

const SVG_MARKUP_PATTERN = /<svg[\s>]/i;
const DANGEROUS_SVG_PATTERN =
  /<\s*\/?\s*(script|foreignobject|iframe|object|embed|link|meta|image|style)\b|javascript\s*:|data\s*:\s*text\/html|(?:^|[\s/])on[a-z]+\s*=|href\s*=\s*['"]\s*(?:https?:|\/\/)|url\s*\(\s*(?!#)/i;

function decodeSvgCharacterReferences(value: string): string {
  let current = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = current
      .replace(/&#x([0-9a-f]{1,6});?/gi, (_, hex: string) => codePoint(Number.parseInt(hex, 16)))
      .replace(/&#([0-9]{1,7});?/g, (_, dec: string) => codePoint(Number.parseInt(dec, 10)))
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'");
    if (decoded === current) {
      return decoded;
    }
    current = decoded;
  }
  return current;
}

function codePoint(code: number): string {
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) {
    return '';
  }
  return String.fromCodePoint(code);
}

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
  const markup = decodeSvgCharacterReferences(value.trim());
  return isInlineSvgMarkup(markup) && !DANGEROUS_SVG_PATTERN.test(markup);
}
