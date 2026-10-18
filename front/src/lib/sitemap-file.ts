import fs from "node:fs";
import path from "node:path";

import { getSitemapRecords, recordsToSitemapXml } from "./sitemap-entries";

export async function writePublicSitemap(): Promise<number> {
  const records = await getSitemapRecords();
  const xml = recordsToSitemapXml(records);
  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml, "utf8");
  return records.length;
}
