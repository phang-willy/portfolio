import { isContactErrorVerbose } from "@/lib/contact-public-message";
import {
  brevoGetAccount,
  brevoSendHtmlEmail,
  BrevoRequestError,
  getBrevoSenderFromEnv,
} from "@/lib/brevo";

const BREVO_ERROR_BODY_MAX = 4000;

export function formatBrevoRequestErrorDetail(
  error: BrevoRequestError,
): string {
  const raw = error.body.trim();
  const truncated = raw.length > BREVO_ERROR_BODY_MAX;
  const slice = truncated ? `${raw.slice(0, BREVO_ERROR_BODY_MAX)}…` : raw;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const o = parsed as Record<string, unknown>;
      const code = o.code;
      const message = o.message;
      if (code !== undefined || message !== undefined) {
        return `HTTP ${error.status}. Code Brevo : ${String(code ?? "—")}. Message : ${String(message ?? "—")}. Corps : ${slice}`;
      }
    }
  } catch {
    /* corps non-JSON */
  }

  return `HTTP ${error.status}. Corps de la réponse : ${slice}`;
}

export type ContactHealthReason =
  | "CONFIG"
  | "QUOTA"
  | "RELAY_DISABLED"
  | "BREVO_ERROR";

export type ContactHealthSnapshot =
  | {
      canSubmit: true;
      creditsRemaining: number | null;
      minCreditsRequired: number;
    }
  | {
      canSubmit: false;
      reason: ContactHealthReason;
      message: string;
      creditsRemaining?: number | null;
      minCreditsRequired?: number;
    };

let lastQuotaFallbackSentAt = 0;

export function getMinBrevoCreditsRequired(): number {
  const raw = process.env.CONTACT_MIN_BREVO_CREDITS?.trim();
  if (!raw) {
    return 2;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 2;
  }
  return n;
}

function getFallbackAlertCooldownMs(): number {
  const raw = process.env.CONTACT_FALLBACK_ALERT_COOLDOWN_MS?.trim();
  if (!raw) {
    return 21_600_000;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return 21_600_000;
  }
  return n;
}

/** Plusieurs lignes `sendLimit` dans `plan` : on retient le solde le plus élevé (évite 0 erroné si une ligne est à 0). */
export function extractSendLimitCredits(plan: unknown): number | null {
  if (!Array.isArray(plan)) {
    return null;
  }

  let highest: number | null = null;

  for (const item of plan) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (row.creditsType !== "sendLimit") {
      continue;
    }

    const rawCredits = row.credits;
    let n: number | null = null;
    if (typeof rawCredits === "number" && Number.isFinite(rawCredits)) {
      n = rawCredits;
    } else if (typeof rawCredits === "string") {
      const parsed = Number.parseFloat(rawCredits);
      if (Number.isFinite(parsed)) {
        n = parsed;
      }
    }

    if (n !== null) {
      highest = highest === null ? n : Math.max(highest, n);
    }
  }

  return highest;
}

export function evaluateContactHealthFromAccount(
  accountBody: unknown,
): ContactHealthSnapshot {
  if (!accountBody || typeof accountBody !== "object") {
    return {
      canSubmit: false,
      reason: "BREVO_ERROR",
      message:
        "Impossible de vérifier le compte d'envoi d'emails. Réessayez plus tard ou contactez directement l'éditeur du site.",
      minCreditsRequired: getMinBrevoCreditsRequired(),
    };
  }

  const o = accountBody as Record<string, unknown>;
  const relay = o.relay;

  if (
    relay &&
    typeof relay === "object" &&
    "enabled" in relay &&
    (relay as { enabled: unknown }).enabled === false
  ) {
    return {
      canSubmit: false,
      reason: "RELAY_DISABLED",
      message:
        "L'envoi d'emails transactionnels est désactivé sur le compte Brevo. Le formulaire de contact est indisponible.",
      minCreditsRequired: getMinBrevoCreditsRequired(),
    };
  }

  const creditsRemaining = extractSendLimitCredits(o.plan);
  const minCreditsRequired = getMinBrevoCreditsRequired();

  if (creditsRemaining !== null && creditsRemaining < minCreditsRequired) {
    return {
      canSubmit: false,
      reason: "QUOTA",
      message: `Le quota d'envoi d'emails est insuffisant pour traiter une demande (il reste ${Math.floor(creditsRemaining)} crédit(s), ${minCreditsRequired} sont nécessaires pour confirmer votre message et prévenir l'administrateur).`,
      creditsRemaining,
      minCreditsRequired,
    };
  }

  return { canSubmit: true, creditsRemaining, minCreditsRequired };
}

export async function fetchContactHealthSnapshot(): Promise<ContactHealthSnapshot> {
  try {
    const account = await brevoGetAccount();
    return evaluateContactHealthFromAccount(account);
  } catch (e) {
    const verbose = isContactErrorVerbose();
    if (verbose && e instanceof BrevoRequestError) {
      return {
        canSubmit: false,
        reason: "BREVO_ERROR",
        message: `L'API Brevo (GET /v3/account) a échoué. ${formatBrevoRequestErrorDetail(e)}`,
        minCreditsRequired: getMinBrevoCreditsRequired(),
      };
    }

    return {
      canSubmit: false,
      reason: "BREVO_ERROR",
      message:
        "Le service d'email ne répond pas ou la clé API est refusée. Le formulaire de contact est temporairement indisponible.",
      minCreditsRequired: getMinBrevoCreditsRequired(),
    };
  }
}

export async function notifyQuotaFallbackIfNeeded(
  creditsRemaining: number,
  minRequired: number,
): Promise<void> {
  const to = process.env.CONTACT_FALLBACK_EMAIL?.trim();
  if (!to) {
    return;
  }

  const cooldown = getFallbackAlertCooldownMs();
  const now = Date.now();
  if (cooldown > 0 && now - lastQuotaFallbackSentAt < cooldown) {
    return;
  }

  try {
    const sender = getBrevoSenderFromEnv();
    const subject =
      "[Portfolio] Alerte quota Brevo — formulaire contact bloqué";
    const html = `<!DOCTYPE html><html lang="fr"><body style="font-family:system-ui,sans-serif;line-height:1.5">
<p>Le formulaire de contact a été désactivé côté site : les crédits d'envoi Brevo (sendLimit) sont trop bas.</p>
<ul>
<li>Crédits restants (sendLimit) : <strong>${escapeHtmlForMail(String(Math.floor(creditsRemaining)))}</strong></li>
<li>Minimum requis par demande : <strong>${escapeHtmlForMail(String(minRequired))}</strong></li>
</ul>
<p>Réapprovisionnez le compte Brevo ou augmentez le plafond pour réactiver le formulaire.</p>
</body></html>`;

    await brevoSendHtmlEmail({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });
    lastQuotaFallbackSentAt = now;
  } catch {
    /* évite de casser le GET si l’alerte échoue (quota à 0, etc.) */
  }
}

function escapeHtmlForMail(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
