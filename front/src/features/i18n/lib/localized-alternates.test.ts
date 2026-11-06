import { describe, expect, it } from "vitest";
import { localizedAlternates } from "@/features/i18n/lib/localized-alternates";

describe("localizedAlternates", () => {
  it("keeps each language on its own URL and French as x-default", () => {
    expect(localizedAlternates("/", "fr")).toEqual({
      canonical: "/",
      languages: {
        fr: "/",
        en: "/en",
        "x-default": "/",
      },
    });

    expect(localizedAlternates("/projects/demo", "en")).toEqual({
      canonical: "/en/projects/demo",
      languages: {
        fr: "/projects/demo",
        en: "/en/projects/demo",
        "x-default": "/projects/demo",
      },
    });
  });
});
