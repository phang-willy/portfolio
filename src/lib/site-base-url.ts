/**
 * Origine publique du site (alignée sur `metadataBase` dans `layout.tsx`).
 */
export function getSiteBaseUrl(): URL {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      // URL invalide : on retombe sur les fallbacks ci-dessous.
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}
