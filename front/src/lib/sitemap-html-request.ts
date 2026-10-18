function quality(accept: string, mediaType: string): number | null {
  const wanted = mediaType.toLowerCase();
  let wildcard: number | null = null;

  for (const part of accept.split(",")) {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType.trim().toLowerCase();
    if (!type) continue;

    let q = 1;
    for (const param of params) {
      const [key, value] = param.split("=");
      if (key?.trim().toLowerCase() !== "q") continue;
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) q = parsed;
    }

    if (type === wanted) return q;
    if (type === "*/*") wildcard = q;
  }

  return wildcard;
}

/** Navigateur humain : page HTML. Robot ou client XML : le sitemap.xml brut. */
export function requestWantsSitemapHtml(
  accept: string | null,
  userAgent: string | null,
): boolean {
  if (/bot|crawler|spider|slurp/i.test(userAgent ?? "")) return false;

  const html = quality(accept ?? "", "text/html");
  if (html == null || html <= 0) return false;

  const xml = Math.max(
    quality(accept ?? "", "application/xml") ?? -1,
    quality(accept ?? "", "text/xml") ?? -1,
  );
  if (xml < 0) return true;
  return html > xml;
}
