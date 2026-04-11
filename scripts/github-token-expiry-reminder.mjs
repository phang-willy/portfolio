/**
 * Rappel : le jour calendaire (UTC) précédant l'expiration du GITHUB_TOKEN,
 * envoie un e-mail texte via Brevo à CONTACT_TO_EMAIL.
 *
 * Usage (depuis la racine du repo) :
 *   node scripts/github-token-expiry-reminder.mjs
 *
 * À planifier une fois par jour (cron, GitHub Actions scheduled, etc.).
 * Variables : GITHUB_TOKEN, BREVO_API_KEY, BREVO_SENDER_EMAIL, CONTACT_TO_EMAIL,
 *             BREVO_SENDER_NAME (optionnel).
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";
const GITHUB_USER_API = "https://api.github.com/user";
const TOKEN_SETTINGS_URL =
  "https://github.com/settings/personal-access-tokens";

function loadEnvFile(fileName) {
  const envPath = path.join(process.cwd(), fileName);
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

function utcCalendarDate(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function parseGithubExpirationHeader(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const tryParse = (s) => {
    const t = Date.parse(s);
    return Number.isNaN(t) ? null : new Date(t);
  };
  return (
    tryParse(trimmed) ??
    tryParse(trimmed.replace(/ UTC$/i, " UTC")) ??
    tryParse(trimmed.replace(/ UTC$/i, "Z"))
  );
}

function formatFrDateTime(d) {
  return d.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function isReminderDayUtc(expirationDate) {
  const expDay = utcCalendarDate(expirationDate);
  const reminderDay = new Date(expDay);
  reminderDay.setUTCDate(reminderDay.getUTCDate() - 1);
  const today = utcCalendarDate(new Date());
  return today.getTime() === reminderDay.getTime();
}

async function fetchGithubTokenExpiration() {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN est absent ou vide.");
  }

  const res = await fetch(GITHUB_USER_API, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const expRaw = res.headers.get("github-authentication-token-expiration");
  await res.arrayBuffer();

  if (!res.ok) {
    throw new Error(
      `GitHub API: ${res.status} (vérifie que GITHUB_TOKEN est valide).`,
    );
  }

  return expRaw;
}

async function brevoSendPlainTextEmail({ toEmail, subject, textContent }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim();

  if (!apiKey) throw new Error("BREVO_API_KEY est absent ou vide.");
  if (!senderEmail) throw new Error("BREVO_SENDER_EMAIL est absent ou vide.");

  const sender = senderName
    ? { email: senderEmail, name: senderName }
    : { email: senderEmail };

  const response = await fetch(BREVO_SMTP_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: toEmail }],
      subject,
      textContent,
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Brevo API ${response.status}: ${rawBody}`);
  }
  return rawBody;
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
  if (!toEmail) {
    console.error("CONTACT_TO_EMAIL est absent ou vide.");
    process.exit(1);
  }

  const expRaw = await fetchGithubTokenExpiration();
  if (!expRaw) {
    console.log(
      "[github-token-expiry-reminder] Pas d'en-tête d'expiration (token sans date d'expiration ou type non concerné). Rien à envoyer.",
    );
    process.exit(0);
  }

  const expirationDate = parseGithubExpirationHeader(expRaw);
  if (!expirationDate) {
    console.error(
      `[github-token-expiry-reminder] Impossible de parser la date : ${expRaw}`,
    );
    process.exit(1);
  }

  if (!isReminderDayUtc(expirationDate)) {
    const fr = formatFrDateTime(expirationDate);
    console.log(
      `[github-token-expiry-reminder] Pas le jour J-1 (expiration ${fr}, Paris). Aucun envoi.`,
    );
    process.exit(0);
  }

  const expiryFormatted = formatFrDateTime(expirationDate);
  const subject = "Rappel : ton GITHUB_TOKEN expire bientôt";
  const textContent = [
    "Salut,",
    "",
    "Petit rappel sympa : le jeton GitHub (GITHUB_TOKEN) utilisé pour le portfolio va expirer demain.",
    "",
    `Date et heure d'expiration prévues : ${expiryFormatted} (fuseau Europe/Paris, format jj/mm/aaaa et hh:mm:ss).`,
    "",
    "Quand tu as cinq minutes, tu peux en générer un nouveau ici :",
    TOKEN_SETTINGS_URL,
    "",
    "Ensuite, pense à mettre à jour la variable sur ton hébergement (Vercel, etc.) et ton fichier .env local, pour éviter une coupure des stats ou des dates des projets.",
    "",
    "Merci et bonne journée !",
  ].join("\n");

  await brevoSendPlainTextEmail({
    toEmail,
    subject,
    textContent,
  });

  console.log(
    `[github-token-expiry-reminder] E-mail de rappel envoyé à ${toEmail}.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[github-token-expiry-reminder]", err);
  process.exit(1);
});
