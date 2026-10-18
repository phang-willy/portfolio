import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import type { ContactFormPayload } from "@/lib/contact-schema";

/**
 * Aplatit un objet de traduction pour Brevo.
 * `BODY.LINE1` devient `BODY_LINE1`, `LABEL.LASTNAME` devient `LABEL_LASTNAME`.
 */
export function flattenBrevoParams(
  value: unknown,
  prefix = "",
): Record<string, string> {
  if (typeof value === "string") {
    return prefix ? { [prefix]: value } : {};
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const params: Record<string, string> = {};
  for (const [key, child] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}_${key}` : key;
    Object.assign(params, flattenBrevoParams(child, nextKey));
  }
  return params;
}

/** Textes du template pour la langue choisie, plus toutes les valeurs saisies. */
export function contactBrevoParams(
  locale: AppLocale,
  data: ContactFormPayload,
): Record<string, string> {
  const copy = getDictionary(locale).contact.email_brevo;

  return {
    ...flattenBrevoParams(copy),
    FIRSTNAME: data.firstName,
    LASTNAME: data.lastName,
    EMAIL: data.email,
    PHONENUMBER: data.phone,
    COMPANY: data.company ?? "",
    TITLE: data.title,
    MESSAGE: data.message,
  };
}
