import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { CONTACT_GENERIC_USER_FACING_MESSAGE } from "@/lib/contact-public-message";
import {
  contactSubmissionBodySchema,
  isHoneypotFilled,
  type ContactFormPayload,
} from "@/lib/contact-schema";
import {
  contactOriginForbiddenResponse,
  contactPayloadTooLargeResponse,
  contactTooManyRequestsResponse,
} from "@/lib/security/contact-api-responses";
import {
  assertPostBodySizeAllowed,
  getClientIp,
  isContactPostOriginAllowed,
  rateLimitContact,
} from "@/lib/security/contact-request";
import { contactBrevoParams } from "@/lib/contact-brevo-params";
import {
  probeContactBackend,
  submitContactToBackend,
} from "@/lib/server/contact-backend";

type ValidationIssue = { path: string[]; message: string };

function mapZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
}

function unavailableResponse() {
  return NextResponse.json({
    canSubmit: false as const,
    reason: "BACKEND" as const,
    message: CONTACT_GENERIC_USER_FACING_MESSAGE,
    creditsRemaining: null,
    minCreditsRequired: null,
  });
}

export async function handleContactGetRequest(request: Request) {
  const rl = rateLimitContact(request, "status");
  if (!rl.ok) {
    return contactTooManyRequestsResponse(rl.retryAfterSeconds);
  }

  const available = await probeContactBackend();
  if (!available) {
    return unavailableResponse();
  }

  return NextResponse.json({
    canSubmit: true as const,
    creditsRemaining: null,
    minCreditsRequired: null,
  });
}

export async function handleContactPostRequest(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        error: "INVALID_JSON",
        message: "Le corps de la requête n'est pas un JSON valide.",
      },
      { status: 400 },
    );
  }

  const parsed = contactSubmissionBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false as const,
        error: "VALIDATION_ERROR",
        issues: mapZodIssues(parsed.error),
      },
      { status: 400 },
    );
  }

  if (isHoneypotFilled(parsed.data.website)) {
    console.warn("[contact] honeypot field filled; submission dropped.");
    return NextResponse.json({ ok: true as const }, { status: 200 });
  }

  const data: ContactFormPayload = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    title: parsed.data.title,
    message: parsed.data.message,
  };

  const result = await submitContactToBackend(
    data,
    fetch,
    contactBrevoParams(parsed.data.locale ?? "fr", data),
    getClientIp(request),
  );
  if (result.ok) {
    return NextResponse.json({ ok: true as const }, { status: 200 });
  }

  if (result.error === "RATE_LIMITED") {
    return contactTooManyRequestsResponse(result.retryAfterSeconds ?? 1);
  }

  if (result.error === "VALIDATION_ERROR") {
    return NextResponse.json(
      {
        ok: false as const,
        error: "VALIDATION_ERROR",
        message: "Le serveur a refusé la demande.",
      },
      { status: 400 },
    );
  }

  if (result.error === "CONTACT_UNAVAILABLE") {
    return NextResponse.json(
      {
        ok: false as const,
        error: "CONTACT_UNAVAILABLE",
        reason: "BACKEND",
        message: CONTACT_GENERIC_USER_FACING_MESSAGE,
      },
      { status: 503 },
    );
  }

  console.error("[contact] backend submission failed");
  return NextResponse.json(
    {
      ok: false as const,
      error: "SERVER_ERROR",
      message: "L'enregistrement du message a échoué.",
    },
    { status: 502 },
  );
}
