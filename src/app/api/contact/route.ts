import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import {
  captchaAnswerMatches,
  readCaptchaFromToken,
} from "@/lib/contact-captcha";
import {
  contactSubmissionBodySchema,
  type ContactFormPayload,
} from "@/lib/contact-schema";
import {
  fetchContactHealthSnapshot,
  formatBrevoRequestErrorDetail,
  getMinBrevoCreditsRequired,
  notifyQuotaFallbackIfNeeded,
  type ContactHealthSnapshot,
} from "@/lib/contact-health";
import { escapeHtml } from "@/lib/escape-html";
import {
  contactConfigUserMessage,
  contactUserMessage,
  isContactErrorVerbose,
} from "@/lib/contact-public-message";
import {
  contactOriginForbiddenResponse,
  contactPayloadTooLargeResponse,
  contactTooManyRequestsResponse,
} from "@/lib/security/contact-api-responses";
import {
  assertPostBodySizeAllowed,
  isContactPostOriginAllowed,
  rateLimitContact,
} from "@/lib/security/contact-request";
import {
  brevoSendHtmlEmail,
  brevoSendTemplateEmail,
  BrevoRequestError,
  getBrevoSenderFromEnv,
} from "@/lib/brevo";

export const dynamic = "force-dynamic";

type ValidationIssue = { path: string[]; message: string };

function mapZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
}

function parseTemplateId(raw: string | undefined): number | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }

  return n;
}

function getContactRuntimeConfig():
  | {
      ok: true;
      adminEmail: string;
      userTemplateId: number;
      adminTemplateId: number | null;
      fallbackEmail: string | null;
      fallbackTemplateId: number | null;
    }
  | { ok: false; reason: string } {
  const adminEmail = process.env.CONTACT_TO_EMAIL?.trim();
  if (!adminEmail) {
    return { ok: false, reason: "CONTACT_TO_EMAIL is not configured." };
  }

  const userTemplateId = parseTemplateId(
    process.env.BREVO_CONTACT_USER_TEMPLATE_ID,
  );
  if (userTemplateId === null) {
    return {
      ok: false,
      reason: "BREVO_CONTACT_USER_TEMPLATE_ID is missing or invalid.",
    };
  }

  const adminTemplateId = parseTemplateId(
    process.env.BREVO_CONTACT_ADMIN_TEMPLATE_ID,
  );
  const fallbackEmail = process.env.CONTACT_FALLBACK_EMAIL?.trim() ?? null;
  const fallbackTemplateId = parseTemplateId(
    process.env.BREVO_CONTACT_FALLBACK_TEMPLATE_ID,
  );

  if (fallbackTemplateId !== null && !fallbackEmail) {
    return {
      ok: false,
      reason:
        "BREVO_CONTACT_FALLBACK_TEMPLATE_ID is set but CONTACT_FALLBACK_EMAIL is missing.",
    };
  }

  try {
    getBrevoSenderFromEnv();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Invalid sender configuration.";
    return { ok: false, reason: message };
  }

  if (!process.env.BREVO_API_KEY?.trim()) {
    return { ok: false, reason: "BREVO_API_KEY is not configured." };
  }

  return {
    ok: true,
    adminEmail,
    userTemplateId,
    adminTemplateId,
    fallbackEmail,
    fallbackTemplateId,
  };
}

function buildAdminEmailHtml(data: ContactFormPayload): string {
  const e = escapeHtml;
  const rows: Array<{ label: string; value: string }> = [
    { label: "Prénom", value: e(data.firstName) },
    { label: "Nom", value: e(data.lastName) },
    { label: "Email", value: e(data.email) },
    { label: "Téléphone", value: e(data.phone) },
    {
      label: "Entreprise",
      value: data.company !== undefined ? e(data.company) : e("—"),
    },
    { label: "Titre", value: e(data.title) },
    { label: "Message", value: e(data.message).replaceAll("\n", "<br />") },
  ];

  const listItems = rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;vertical-align:top;">${row.label}</td><td style="padding:8px 12px;border:1px solid #ddd;">${row.value}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
    <p style="font-size:16px;margin:0 0 12px;">Nouveau message depuis le formulaire de contact.</p>
    <table style="border-collapse:collapse;max-width:640px;">${listItems}</table>
  </body>
</html>`;
}

function buildAdminSubject(data: ContactFormPayload): string {
  const subject = `[Contact] ${data.lastName} ${data.firstName}`;
  return subject
    .replace(/[\r\n\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ")
    .trim()
    .slice(0, 998);
}

function templateParamsFromPayload(
  data: ContactFormPayload,
): Record<string, string> {
  return {
    FIRSTNAME: data.firstName,
    LASTNAME: data.lastName,
    EMAIL: data.email,
    PHONE_NUMBER: data.phone,
    COMPANY: data.company ?? "",
    TITLE: data.title,
    MESSAGE: data.message,
  };
}

function contactStatusJson(health: ContactHealthSnapshot) {
  const verbose = isContactErrorVerbose();

  if (health.canSubmit) {
    return {
      canSubmit: true as const,
      creditsRemaining: health.creditsRemaining,
      minCreditsRequired: health.minCreditsRequired,
    };
  }

  return {
    canSubmit: false as const,
    reason: health.reason,
    message: contactUserMessage(verbose, health.message),
    creditsRemaining: health.creditsRemaining ?? null,
    minCreditsRequired: health.minCreditsRequired,
  };
}

export async function GET(request: Request) {
  const rl = rateLimitContact(request, "status");
  if (!rl.ok) {
    return contactTooManyRequestsResponse(rl.retryAfterSeconds);
  }

  const config = getContactRuntimeConfig();
  if (!config.ok) {
    return NextResponse.json({
      canSubmit: false as const,
      reason: "CONFIG" as const,
      message: contactConfigUserMessage(isContactErrorVerbose(), config.reason),
      creditsRemaining: null,
      minCreditsRequired: getMinBrevoCreditsRequired(),
    });
  }

  const health = await fetchContactHealthSnapshot();

  if (
    !health.canSubmit &&
    health.reason === "QUOTA" &&
    typeof health.creditsRemaining === "number"
  ) {
    await notifyQuotaFallbackIfNeeded(
      health.creditsRemaining,
      health.minCreditsRequired ?? 2,
    );
  }

  return NextResponse.json(contactStatusJson(health));
}

export async function POST(request: Request) {
  const verbose = isContactErrorVerbose();

  const rlPost = rateLimitContact(request, "post");
  if (!rlPost.ok) {
    return contactTooManyRequestsResponse(rlPost.retryAfterSeconds);
  }

  if (!isContactPostOriginAllowed(request)) {
    return contactOriginForbiddenResponse();
  }

  if (!assertPostBodySizeAllowed(request)) {
    return contactPayloadTooLargeResponse();
  }

  const config = getContactRuntimeConfig();
  if (!config.ok) {
    console.error("[contact]", config.reason);
    return NextResponse.json(
      {
        ok: false as const,
        error: "SERVER_MISCONFIGURED",
        message: contactConfigUserMessage(verbose, config.reason),
      },
      { status: 503 },
    );
  }

  const health = await fetchContactHealthSnapshot();
  if (!health.canSubmit) {
    return NextResponse.json(
      {
        ok: false as const,
        error: "CONTACT_UNAVAILABLE",
        reason: health.reason,
        message: contactUserMessage(verbose, health.message),
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        error: "INVALID_JSON",
        message: contactUserMessage(
          verbose,
          "Le corps de la requête n'est pas un JSON valide.",
        ),
      },
      { status: 400 },
    );
  }

  const parsed = contactSubmissionBodySchema.safeParse(body);
  if (!parsed.success) {
    const issues = mapZodIssues(parsed.error);
    return NextResponse.json(
      {
        ok: false as const,
        error: "VALIDATION_ERROR",
        issues,
      },
      { status: 400 },
    );
  }

  const submission = parsed.data;
  let captchaPayload: ReturnType<typeof readCaptchaFromToken>;
  try {
    captchaPayload = readCaptchaFromToken(submission.captchaToken);
  } catch {
    captchaPayload = null;
  }

  if (
    !captchaPayload ||
    !captchaAnswerMatches(captchaPayload.code, submission.captcha)
  ) {
    return NextResponse.json(
      {
        ok: false as const,
        error: "VALIDATION_ERROR",
        issues: [
          {
            path: ["captcha"],
            message:
              "Le code ne correspond pas ou a expiré. Générez un nouveau code et recopiez-le exactement.",
          },
        ],
      },
      { status: 400 },
    );
  }

  const data: ContactFormPayload = {
    firstName: submission.firstName,
    lastName: submission.lastName,
    email: submission.email,
    phone: submission.phone,
    company: submission.company,
    title: submission.title,
    message: submission.message,
  };
  const sender = getBrevoSenderFromEnv();
  const contactName = `${data.firstName} ${data.lastName}`.trim();
  const replyTo = { email: data.email, name: contactName || undefined };
  const params = templateParamsFromPayload(data);

  try {
    if (config.adminTemplateId !== null) {
      await brevoSendTemplateEmail({
        sender,
        to: [{ email: config.adminEmail }],
        templateId: config.adminTemplateId,
        params,
        replyTo,
      });
    } else {
      const adminHtml = buildAdminEmailHtml(data);
      const adminSubject = buildAdminSubject(data);
      await brevoSendHtmlEmail({
        sender,
        to: [{ email: config.adminEmail }],
        subject: adminSubject,
        htmlContent: adminHtml,
        replyTo,
      });
    }
  } catch (e) {
    if (e instanceof BrevoRequestError) {
      console.error("[contact] Brevo admin email failed:", e.status, e.body);
    } else {
      console.error("[contact] Admin email failed:", e);
    }
    const detail =
      e instanceof BrevoRequestError
        ? `Échec Brevo lors de l'envoi vers l'administrateur. ${formatBrevoRequestErrorDetail(e)}`
        : e instanceof Error
          ? `Échec lors de l'envoi vers l'administrateur : ${e.message}`
          : "L'envoi du message vers la boîte administrateur a échoué (réponse Brevo ou erreur réseau). Vérifiez la clé API, l'expéditeur et les quotas.";
    return NextResponse.json(
      {
        ok: false as const,
        error: "MAIL_ADMIN_FAILED",
        message: contactUserMessage(verbose, detail),
      },
      { status: 502 },
    );
  }

  if (config.fallbackEmail && config.fallbackTemplateId !== null) {
    try {
      await brevoSendTemplateEmail({
        sender,
        to: [{ email: config.fallbackEmail }],
        templateId: config.fallbackTemplateId,
        params,
        replyTo,
      });
    } catch (e) {
      if (e instanceof BrevoRequestError) {
        console.error(
          "[contact] Brevo fallback template failed:",
          e.status,
          e.body,
        );
      } else {
        console.error("[contact] Fallback template failed:", e);
      }
      const detail =
        e instanceof BrevoRequestError
          ? `Échec Brevo (copie secondaire / template fallback). ${formatBrevoRequestErrorDetail(e)}`
          : e instanceof Error
            ? `Échec envoi copie secondaire : ${e.message}`
            : "Votre message a été notifié sur la boîte principale, mais l'envoi de la copie vers l'adresse secondaire (template fallback) a échoué côté Brevo.";
      return NextResponse.json(
        {
          ok: false as const,
          error: "MAIL_FALLBACK_FAILED",
          message: contactUserMessage(verbose, detail),
        },
        { status: 502 },
      );
    }
  }

  try {
    await brevoSendTemplateEmail({
      sender,
      to: [{ email: data.email, name: data.firstName || undefined }],
      templateId: config.userTemplateId,
      params,
    });
  } catch (e) {
    if (e instanceof BrevoRequestError) {
      console.error("[contact] Brevo user template failed:", e.status, e.body);
    } else {
      console.error("[contact] User confirmation failed:", e);
    }
    const detail =
      e instanceof BrevoRequestError
        ? `Échec Brevo (email de confirmation visiteur). ${formatBrevoRequestErrorDetail(e)}`
        : e instanceof Error
          ? `Échec email de confirmation : ${e.message}`
          : "Votre message a bien été transmis à l'administrateur, mais l'email de confirmation (template Brevo) n'a pas pu être envoyé à votre adresse.";
    return NextResponse.json(
      {
        ok: false as const,
        error: "MAIL_USER_FAILED",
        message: contactUserMessage(verbose, detail),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true as const }, { status: 200 });
}
