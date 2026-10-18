/**
 * Génère `public/sitemap.xml` à partir de la même logique que l’ancien `app/sitemap.ts`
 * (`getSitemapRecords` dans `src/lib/sitemap-entries.ts`).
 *
 * Usage : `npm run generate:sitemap`, ou le bouton « Generate sitemap » du dashboard admin.
 * Cron (ex. tous les jours à 2:00) :
 *   0 2 * * * cd /chemin/vers/portfolio/front && npm run generate:sitemap
 *
 * Après déploiement, un `pm2 restart` n’est en général pas nécessaire : le fichier
 * dans `public/` est servi à la prochaine requête sur `/sitemap.xml`.
 *
 * Prérequis : `.env` avec `NEXT_PUBLIC_SITE_URL` ou `SITE_URL` en prod.
 */
import fs from "node:fs";
import path from "node:path";

import { writePublicSitemap } from "../src/lib/sitemap-file";

function loadEnvFile(envPath: string) {
  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

async function main() {
  [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", ".env.local"),
    path.join(process.cwd(), ".env.exemple"),
    path.join(process.cwd(), "..", ".env.exemple"),
  ].forEach(loadEnvFile);

  const urlCount = await writePublicSitemap();
  const outFile = path.join(process.cwd(), "public", "sitemap.xml");

  console.log(
    `[generate-sitemap-xml] Écrit ${urlCount} URL(s) → ${path.relative(process.cwd(), outFile)}`,
  );
}

void main().catch((err) => {
  console.error("[generate-sitemap-xml]", err);
  process.exit(1);
});
