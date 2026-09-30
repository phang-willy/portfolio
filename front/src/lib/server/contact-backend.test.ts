import { afterEach, describe, expect, it, vi } from "vitest";

import {
  probeContactBackend,
  submitContactToBackend,
} from "@/lib/server/contact-backend";
import type { ContactFormPayload } from "@/lib/contact-schema";

const payload: ContactFormPayload = {
  firstName: "Test",
  lastName: "Contact",
  email: "test@example.com",
  phone: "0600000000",
  company: undefined,
  title: "Test Day 2",
  message: "Contact end-to-end test",
};

describe("contact backend proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.BACKEND_API_URL;
  });

  it("posts only the public fields to Spring", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    const fetchImpl = vi.fn(async () =>
      Response.json({ success: true, code: 200, message: "OK", data: null }),
    );

    await expect(submitContactToBackend(payload, fetchImpl)).resolves.toEqual({
      ok: true,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://backend.test/api/contact",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          firstName: "Test",
          lastName: "Contact",
          email: "test@example.com",
          phone: "0600000000",
          company: null,
          title: "Test Day 2",
          message: "Contact end-to-end test",
          website: "",
          brevoParams: {},
        }),
      }),
    );
  });

  it("maps a backend validation failure without forwarding its body", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { success: false, code: 400, message: "Bad Request", data: null },
        { status: 400 },
      ),
    );

    await expect(submitContactToBackend(payload, fetchImpl)).resolves.toEqual({
      ok: false,
      status: 400,
      error: "VALIDATION_ERROR",
    });
  });

  it("maps a backend failure and a rate limit", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    const failing = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(submitContactToBackend(payload, failing)).resolves.toEqual({
      ok: false,
      status: 502,
      error: "SERVER_ERROR",
    });

    const limited = vi.fn(
      async () => new Response(null, { status: 429, headers: { "Retry-After": "3" } }),
    );
    await expect(submitContactToBackend(payload, limited)).resolves.toEqual({
      ok: false,
      status: 429,
      error: "RATE_LIMITED",
      retryAfterSeconds: 3,
    });
  });

  it("reports the backend as unavailable when health check fails", async () => {
    process.env.BACKEND_API_URL = "http://backend.test";
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }));

    await expect(probeContactBackend(fetchImpl)).resolves.toBe(false);
    await expect(probeContactBackend(vi.fn(async () => Response.json({ success: true })))).resolves.toBe(
      true,
    );
  });
});
