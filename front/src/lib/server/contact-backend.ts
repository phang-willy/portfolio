import { getBackendApiUrl } from "@/lib/api/backend";
import type { ContactFormPayload } from "@/lib/contact-schema";

export type ContactBackendResult =
  | { ok: true }
  | {
      ok: false;
      status: 400 | 429 | 502 | 503;
      error: "VALIDATION_ERROR" | "RATE_LIMITED" | "CONTACT_UNAVAILABLE" | "SERVER_ERROR";
      retryAfterSeconds?: number;
    };

export async function probeContactBackend(
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(`${getBackendApiUrl()}/api/health`, {
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function submitContactToBackend(
  data: ContactFormPayload,
  fetchImpl: typeof fetch = fetch,
  brevoParams: Record<string, string> = {},
): Promise<ContactBackendResult> {
  let response: Response;
  try {
    response = await fetchImpl(`${getBackendApiUrl()}/api/contact`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company ?? null,
        title: data.title,
        message: data.message,
        website: "",
        brevoParams,
      }),
    });
  } catch {
    return { ok: false, status: 503, error: "CONTACT_UNAVAILABLE" };
  }

  if (response.status === 429) {
    return {
      ok: false,
      status: 429,
      error: "RATE_LIMITED",
      retryAfterSeconds: retryAfterSeconds(response),
    };
  }

  if (response.status === 400) {
    return { ok: false, status: 400, error: "VALIDATION_ERROR" };
  }

  if (!response.ok) {
    return { ok: false, status: 502, error: "SERVER_ERROR" };
  }

  try {
    const payload = (await response.json()) as { success?: unknown };
    if (payload?.success !== true) {
      return { ok: false, status: 502, error: "SERVER_ERROR" };
    }
  } catch {
    return { ok: false, status: 502, error: "SERVER_ERROR" };
  }

  return { ok: true };
}

function retryAfterSeconds(response: Response): number {
  const raw = response.headers.get("retry-after");
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
