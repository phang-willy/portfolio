/**
 * Origine du backend contact (ex. https://api.tondomaine.com).
 * En production statique, définir NEXT_PUBLIC_CONTACT_API_ORIGIN pour que le
 * formulaire appelle ton PHP sur le sous-domaine. Les chemins restent /api/contact
 * et /api/contact/captcha (adapter le routage côté PHP si besoin).
 */
export function getContactApiUrl(
  path: "/api/contact" | "/api/contact/captcha",
): string {
  const origin = process.env.NEXT_PUBLIC_CONTACT_API_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return `${origin}${path}`;
  }
  return path;
}
