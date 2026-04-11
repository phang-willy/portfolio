import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/site-base-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteBaseUrl().origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
