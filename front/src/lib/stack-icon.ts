const SVG_MARKUP_PATTERN = /<svg[\s>]/i;
const DANGEROUS_SVG_PATTERN =
  /<\s*\/?\s*(script|foreignobject|iframe|object|embed|link|meta|image|style)\b|javascript\s*:|data\s*:\s*text\/html|(?:^|[\s/])on[a-z]+\s*=|href\s*=\s*['"]\s*(?:https?:|\/\/)|url\s*\(\s*(?!#)/i;

function decodeSvgCharacterReferences(value: string): string {
  let current = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = current
      .replace(/&#x([0-9a-f]{1,6});?/gi, (_, hex: string) =>
        codePoint(Number.parseInt(hex, 16)),
      )
      .replace(/&#([0-9]{1,7});?/g, (_, dec: string) =>
        codePoint(Number.parseInt(dec, 10)),
      )
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
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
    return "";
  }
  return String.fromCodePoint(code);
}

/** Returns stored stack SVG only when it is static inline markup. */
export function safeInlineSvg(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const markup = decodeSvgCharacterReferences(value.trim());
  if (!SVG_MARKUP_PATTERN.test(markup) || DANGEROUS_SVG_PATTERN.test(markup)) {
    return null;
  }

  return markup;
}
