import { NextResponse } from "next/server";

export function contactTooManyRequestsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false as const,
      error: "RATE_LIMITED",
      message: `Trop de requêtes depuis cette adresse. Réessayez dans ${retryAfterSeconds} seconde(s).`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function contactOriginForbiddenResponse() {
  return NextResponse.json(
    {
      ok: false as const,
      error: "FORBIDDEN_ORIGIN",
      message: "La requête a été refusée (origine non autorisée).",
    },
    { status: 403 },
  );
}

export function contactPayloadTooLargeResponse() {
  return NextResponse.json(
    {
      ok: false as const,
      error: "PAYLOAD_TOO_LARGE",
      message: "Le corps de la requête est trop volumineux.",
    },
    { status: 413 },
  );
}
