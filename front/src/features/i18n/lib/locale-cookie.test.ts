import { describe, expect, it } from "vitest";
import {
  homeLocaleRedirectPath,
  parseLocaleCookieHeader,
} from "@/features/i18n/lib/locale-cookie";

describe("parseLocaleCookieHeader", () => {
  it("reads a valid locale and ignores the rest", () => {
    expect(parseLocaleCookieHeader("theme=dark; locale=en")).toBe("en");
    expect(parseLocaleCookieHeader("locale=%20EN%20")).toBe("en");
    expect(parseLocaleCookieHeader("locale=fr")).toBe("fr");
  });

  it("returns null when the cookie is missing or not a locale", () => {
    expect(parseLocaleCookieHeader("")).toBeNull();
    expect(parseLocaleCookieHeader("locale=de")).toBeNull();
    expect(parseLocaleCookieHeader("locale=%")).toBeNull();
  });
});

describe("homeLocaleRedirectPath", () => {
  it("sends the French home to /en when the cookie is en", () => {
    expect(homeLocaleRedirectPath("/", "en")).toBe("/en");
    expect(homeLocaleRedirectPath("", "en", "?q=1", "#top")).toBe(
      "/en?q=1#top",
    );
  });

  it("leaves every other arrival on the page that was requested", () => {
    expect(homeLocaleRedirectPath("/projects", "en")).toBeNull();
    expect(homeLocaleRedirectPath("/en", "en")).toBeNull();
    expect(homeLocaleRedirectPath("/", "fr")).toBeNull();
    expect(homeLocaleRedirectPath("/", null)).toBeNull();
  });
});
