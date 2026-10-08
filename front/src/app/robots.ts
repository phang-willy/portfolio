import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_NOINDEX === "true") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const origin = getSiteBaseUrl().origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/sitemap-view",
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
