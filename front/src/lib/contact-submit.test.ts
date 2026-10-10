import { afterEach, describe, expect, it, vi } from "vitest";

import { createSubmitLock, postContact, runExclusive } from "@/lib/contact-submit";
import type { ContactSubmissionBody } from "@/lib/contact-schema";

const body: ContactSubmissionBody = {
  firstName: "Test",
  lastName: "Contact",
  email: "test@example.com",
  phone: "0600000000",
  company: undefined,
  title: "Test Day 2",
  message: "Contact end-to-end test",
  website: "",
  locale: "fr",
};

describe("postContact", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns success when the contact route accepts the form", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ ok: true }));

    await expect(postContact(body, fetchImpl)).resolves.toEqual({ type: "success" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns field errors for a validation response", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          issues: [{ path: ["email"], message: "Adresse email invalide." }],
        },
        { status: 400 },
      ),
    );

    await expect(postContact(body, fetchImpl)).resolves.toEqual({
      type: "validation",
      issues: [{ path: ["email"], message: "Adresse email invalide." }],
    });
  });

  it("returns a failure when the backend rejects the submission", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { ok: false, error: "SERVER_ERROR", message: "Une erreur est survenue." },
        { status: 502 },
      ),
    );

    await expect(postContact(body, fetchImpl)).resolves.toEqual({
      type: "failure",
      message: "Une erreur est survenue.",
    });
  });

  it("returns unavailable when the contact service is down", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { ok: false, error: "CONTACT_UNAVAILABLE", reason: "BACKEND", message: "Indisponible" },
        { status: 503 },
      ),
    );

    await expect(postContact(body, fetchImpl)).resolves.toEqual({
      type: "unavailable",
      message: "Indisponible",
      reason: "BACKEND",
    });
  });

  it("returns network when the request cannot be sent", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    });

    await expect(postContact(body, fetchImpl)).resolves.toEqual({ type: "network" });
  });
});

describe("contact submit lock", () => {
  it("keeps a submission pending and ignores a second submit until it finishes", async () => {
    const lock = createSubmitLock();
    let finish: (value: string) => void = () => {};
    const first = runExclusive(
      lock,
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );

    expect(lock.pending).toBe(true);
    await expect(runExclusive(lock, async () => "second")).resolves.toBeUndefined();

    finish("done");
    await expect(first).resolves.toBe("done");
    expect(lock.pending).toBe(false);
    await expect(runExclusive(lock, async () => "third")).resolves.toBe("third");
  });
});
