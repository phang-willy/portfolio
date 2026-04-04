import { z } from "zod";

const phoneRegex = /^[\d\s+().\-/]+$/;

export function normalizeCaptchaInput(value: string): string {
  return value.replace(/\s+/g, "");
}

export const contactFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Le prénom est requis.")
    .max(100, "Le prénom est trop long."),
  lastName: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(100, "Le nom est trop long."),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est requise.")
    .max(320, "L'adresse email est trop longue.")
    .email("Adresse email invalide."),
  phone: z
    .string()
    .trim()
    .min(1, "Le téléphone est requis.")
    .max(40, "Le téléphone est trop long.")
    .regex(phoneRegex, "Format de téléphone invalide."),
  company: z
    .string()
    .trim()
    .max(200, "Le nom de l'entreprise est trop long.")
    .transform((value) => (value === "" ? undefined : value)),
  title: z
    .string()
    .trim()
    .min(1, "Le titre est requis.")
    .max(200, "Le titre est trop long."),
  message: z
    .string()
    .trim()
    .min(1, "Le message est requis.")
    .max(10_000, "Le message est trop long."),
});

export type ContactFormPayload = z.infer<typeof contactFormSchema>;

export const contactSubmissionBodySchema = contactFormSchema.extend({
  captcha: z.preprocess(
    (val) => (typeof val === "string" ? normalizeCaptchaInput(val) : val),
    z.string().min(1, "Recopiez le code affiché."),
  ),
  captchaToken: z
    .string()
    .trim()
    .min(1, "Jeton de vérification manquant. Générez un nouveau code."),
});

export type ContactSubmissionBody = z.infer<typeof contactSubmissionBodySchema>;
