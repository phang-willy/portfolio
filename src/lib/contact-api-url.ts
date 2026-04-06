/**
 * URL des endpoints contact.
 *
 * - **Développement** (`next dev`) : chemins relatifs `/api/...` sur la même origine
 *   (localhost, IP locale, etc.). `NEXT_PUBLIC_CONTACT_API_ORIGIN` est ignoré pour
 *   éviter d’appeler la prod avec un `.env` partagé.
 * - **Production** : si `NEXT_PUBLIC_CONTACT_API_ORIGIN` est défini (build), préfixe
 *   absolu ; sinon chemins relatifs (même hôte que le site, ex. Next complet sur Vercel).
 */
export function getContactApiUrl(
  path: "/api/contact" | "/api/contact/captcha",
): string {
  if (process.env.NODE_ENV === "development") {
    return path;
  }
  const origin = process.env.NEXT_PUBLIC_CONTACT_API_ORIGIN?.replace(/\/$/, "");
  if (origin) {
    return `${origin}${path}`;
  }
  return path;
}
