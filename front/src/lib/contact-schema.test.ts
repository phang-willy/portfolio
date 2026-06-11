import { describe, expect, it } from "vitest";

import { isHoneypotFilled } from "./contact-schema";

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
