import { describe, expect, it } from "vitest";

import { safeInlineSvg } from "@/lib/stack-icon";

describe("safeInlineSvg", () => {
  it("keeps a static inline svg", () => {
    const markup =
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h8v8z"/></svg>';
    expect(safeInlineSvg(markup)).toBe(markup);
  });

  it("drops scripts and missing markup", () => {
    expect(safeInlineSvg(null)).toBeNull();
    expect(safeInlineSvg("  ")).toBeNull();
    expect(safeInlineSvg("<svg><script>alert(1)</script></svg>")).toBeNull();
  });
});
