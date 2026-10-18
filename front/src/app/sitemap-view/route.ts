import { NextResponse } from "next/server";

import {
  getSitemapRecords,
  recordsToSitemapHtml,
} from "@/lib/sitemap-entries";

export const dynamic = "force-dynamic";

export async function GET() {
  const records = await getSitemapRecords();
  return new NextResponse(recordsToSitemapHtml(records), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
