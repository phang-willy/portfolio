import { describe, expect, it } from "vitest";

import { en } from "@/features/i18n/dictionaries/en";
import { fr } from "@/features/i18n/dictionaries/fr";
import {
  contactBrevoParams,
  flattenBrevoParams,
} from "@/lib/contact-brevo-params";
import type { ContactFormPayload } from "@/lib/contact-schema";

const payload: ContactFormPayload = {
  firstName: "Léa",
  lastName: "Martin",
  email: "lea@example.test",
  phone: "0600000000",
  company: "Atelier",
  title: "Projet",
  message: "Bonjour",
};

describe("flattenBrevoParams", () => {
  it("turns nested dictionary keys into Brevo params", () => {
    expect(flattenBrevoParams(fr.contact.email_brevo)).toMatchObject({
      OBJECT: "Merci beaucoup pour votre message !",
      BODY_LINE1: "Bonjour, Bonsoir",
      BODY_LINE2: "Merci pour votre message.",
      BODY_LINE3: "Nous avons bien reçu votre demande concernant :",
      LABEL_LASTNAME: "NOM :",
      LABEL_FIRSTNAME: "PRENOM :",
      LABEL_PHONENUMBER: "TELEPHONE :",
      FOOTER_FOLLOW: "Me retrouver sur",
      FOOTER_UNFOLLOW: "Se désinsrire",
    });
  });
});

describe("contactBrevoParams", () => {
  it("sends every French template param and the submitted values", () => {
    const params = contactBrevoParams("fr", payload);

    expect(params).toMatchObject(flattenBrevoParams(fr.contact.email_brevo));
    expect(params).toMatchObject({
      FIRSTNAME: "Léa",
      LASTNAME: "Martin",
      EMAIL: "lea@example.test",
      PHONENUMBER: "0600000000",
      COMPANY: "Atelier",
      TITLE: "Projet",
      MESSAGE: "Bonjour",
    });
  });

  it("switches the template copy when the form language is English", () => {
    const params = contactBrevoParams("en", { ...payload, company: undefined });

    expect(params.OBJECT).toBe(en.contact.email_brevo.OBJECT);
    expect(params.BODY_LINE1).toBe("Hello, good evening");
    expect(params.LABEL_LASTNAME).toBe("LASTNAME :");
    expect(params.COMPANY).toBe("");
    expect(params.FIRSTNAME).toBe("Léa");
  });
});
