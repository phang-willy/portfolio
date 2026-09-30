import { getContactApiUrl } from "@/lib/contact-api-url";
import type { ContactSubmissionBody } from "@/lib/contact-schema";

export type ContactApiIssue = { path: string[]; message: string };

export type ContactPostResult =
  | { type: "success" }
  | { type: "validation"; issues: ContactApiIssue[] }
  | { type: "unavailable"; message?: string; reason?: string }
  | { type: "failure"; message?: string }
  | { type: "invalid" }
  | { type: "network" };

type ContactApiResponse =
  | { ok: true }
  | {
      ok: false;
      error: string;
      message?: string;
      reason?: string;
      issues?: ContactApiIssue[];
    };

export function createSubmitLock() {
  let pending = false;

  return {
    get pending() {
      return pending;
    },
    tryAcquire() {
      if (pending) {
        return false;
      }
      pending = true;
      return true;
    },
    release() {
      pending = false;
    },
  };
}

export type SubmitLock = ReturnType<typeof createSubmitLock>;

export async function runExclusive<T>(
  lock: SubmitLock,
  task: () => Promise<T>,
): Promise<T | undefined> {
  if (!lock.tryAcquire()) {
    return undefined;
  }

  try {
    return await task();
  } finally {
    lock.release();
  }
}

export async function postContact(
  body: ContactSubmissionBody,
  fetchImpl: typeof fetch = fetch,
): Promise<ContactPostResult> {
  let response: Response;
  try {
    response = await fetchImpl(getContactApiUrl("/api/contact"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { type: "network" };
  }

  let payload: ContactApiResponse;
  try {
    payload = (await response.json()) as ContactApiResponse;
  } catch {
    return { type: "invalid" };
  }

  if (!response.ok || !payload.ok) {
    if (payload.ok === false && payload.error === "VALIDATION_ERROR" && payload.issues) {
      return { type: "validation", issues: payload.issues };
    }

    if (payload.ok === false && payload.error === "CONTACT_UNAVAILABLE") {
      return {
        type: "unavailable",
        message: payload.message,
        reason: payload.reason,
      };
    }

    return {
      type: "failure",
      message: payload.ok === false ? payload.message : undefined,
    };
  }

  return { type: "success" };
}
