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
    expect(safeInlineSvg("<svg><script>alert(1)</script></svg>")).toBe("<svg/>");
    expect(safeInlineSvg("<svg onload=\"alert(1)\"></svg>")).toBe("<svg/>");
  });

  it("strips urls whose scheme is hidden by character references", () => {
    expect(
      safeInlineSvg('<svg><a href="java&#x09;script:alert(1)">x</a></svg>'),
    ).toBe("<svg><a>x</a></svg>");
    expect(
      safeInlineSvg('<svg><use href="https://evil.example/x.svg#a"/></svg>'),
    ).toBe("<svg><use/></svg>");
    expect(safeInlineSvg('<svg><use href="#icon"/></svg>')).toBe(
      '<svg><use href="#icon"/></svg>',
    );
    expect(
      safeInlineSvg('<svg><path fill="url(&#x6A;avascript:alert(1))" d="M0 0h1v1z"/></svg>'),
    ).toBe('<svg><path d="M0 0h1v1z"/></svg>');
    expect(
      safeInlineSvg('<svg><a href="java&Tab;script&colon;alert(1)">x</a></svg>'),
    ).toBe("<svg><a>x</a></svg>");
  });
});
