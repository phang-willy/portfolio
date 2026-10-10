import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/backend", () => ({
  getBackendApiUrl: () => "http://back:8000",
  PORTFOLIO_DATA_REVALIDATE_SECONDS: 60,
}));

import { GET } from "./[filename]/route";

describe("project image proxy", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the backend image security headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "X-Content-Type-Options": "nosniff",
              "Content-Security-Policy": "default-src 'none'; sandbox",
            },
          }),
      ),
    );

    const response = await GET(new Request("http://localhost/api/project/image/icon.svg"), {
      params: Promise.resolve({ filename: "icon.svg" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Security-Policy")).toContain("sandbox");
  });

  it("adds security headers when the backend omits them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 })),
    );

    const response = await GET(new Request("http://localhost/api/project/image/photo.png"), {
      params: Promise.resolve({ filename: "photo.png" }),
    });

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
  });
});
