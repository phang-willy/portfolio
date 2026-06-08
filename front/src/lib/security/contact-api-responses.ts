import { NextResponse } from "next/server";
import {
  contactUserMessage,
  isContactErrorVerbose,
} from "@/lib/contact-public-message";

export function contactTooManyRequestsResponse(retryAfterSeconds: number) {
  const verbose = isContactErrorVerbose();
  return NextResponse.json(
    {
      ok: false as const,
      error: "RATE_LIMITED",
      message: contactUserMessage(
        verbose,
        `Trop de requêtes depuis cette adresse. Réessayez dans ${retryAfterSeconds} seconde(s).`,
      ),
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function contactOriginForbiddenResponse() {
  const verbose = isContactErrorVerbose();
  return NextResponse.json(
    {
      ok: false as const,
      error: "FORBIDDEN_ORIGIN",
      message: contactUserMessage(
        verbose,
        "La requête a été refusée (origine non autorisée).",
      ),
    },
    { status: 403 },
  );
}

export function contactPayloadTooLargeResponse() {
  const verbose = isContactErrorVerbose();
  return NextResponse.json(
    {
      ok: false as const,
      error: "PAYLOAD_TOO_LARGE",
      message: contactUserMessage(
        verbose,
        "Le corps de la requête est trop volumineux.",
      ),
    },
    { status: 413 },
  );
}
