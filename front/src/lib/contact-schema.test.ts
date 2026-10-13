import { describe, expect, it } from "vitest";

import { contactSubmissionBodySchema, isHoneypotFilled } from "./contact-schema";

describe("isHoneypotFilled", () => {
  it("returns false when honeypot is empty or whitespace", () => {
    expect(isHoneypotFilled("")).toBe(false);
    expect(isHoneypotFilled("   ")).toBe(false);
  });

  it("returns true when honeypot has content", () => {
    expect(isHoneypotFilled("spam")).toBe(true);
    expect(isHoneypotFilled("  bot  ")).toBe(true);
  });
});

describe("contactSubmissionBodySchema", () => {
  const body = {
    firstName: "E2E",
    lastName: "Visitor",
    email: "e2e@example.com",
    phone: "0600000000",
    title: "Sujet",
    message: "Message",
    website: "",
    locale: "fr" as const,
  };

  it("accepts a blank or omitted company", () => {
    const blank = contactSubmissionBodySchema.safeParse({ ...body, company: "" });
    const omitted = contactSubmissionBodySchema.safeParse(body);

    expect(blank.success).toBe(true);
    expect(omitted.success).toBe(true);
    if (blank.success && omitted.success) {
      expect(blank.data.company).toBe("");
      expect(omitted.data.company).toBe("");
    }
  });
});
