import { NextResponse } from "next/server";

import { sitemapRequestAllowed } from "@/lib/sitemap-auth";
import { writePublicSitemap } from "@/lib/sitemap-file";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const allowed = sitemapRequestAllowed(
    request.headers.get("x-sitemap-token"),
    process.env.SITEMAP_GENERATE_TOKEN,
  );
  if (!allowed.ok) {
    const message =
      allowed.status === 503
        ? "Sitemap generation is not configured"
        : "Unauthorized";
    return NextResponse.json({ message }, { status: allowed.status });
  }

  try {
    const urlCount = await writePublicSitemap();
    return NextResponse.json({ urlCount });
  } catch (error) {
    console.error("[sitemap] generation failed", error);
    return NextResponse.json(
      { message: "Sitemap generation failed" },
      { status: 500 },
    );
  }
}
