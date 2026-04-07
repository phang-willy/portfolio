export const CONTACT_GENERIC_USER_FACING_MESSAGE =
  "Le formulaire de contact est momentanément indisponible.\nNous vous prions de nous excuser pour la gêne occasionnée.\nPour toute demande, merci de vous reporter aux coordonnées figurant dans les mentions légales.";

export function isContactErrorVerbose(): boolean {
  const v = process.env.CONTACT_ERROR?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function contactUserMessage(verbose: boolean, detailed: string): string {
  return verbose ? detailed : CONTACT_GENERIC_USER_FACING_MESSAGE;
}

const CONFIG_REASON_HINTS: Record<string, string> = {
  "CONTACT_TO_EMAIL is not configured.":
    "la variable d'environnement CONTACT_TO_EMAIL (adresse qui reçoit les messages du formulaire) n'est pas définie ou est vide.",
  "BREVO_CONTACT_USER_TEMPLATE_ID is missing or invalid.":
    "définir BREVO_CONTACT_FR_USER_TEMPLATE_ID (recommandé) ou, à défaut, BREVO_CONTACT_USER_TEMPLATE_ID (ancien nom) : identifiant entier du template Brevo de confirmation visiteur en français. Optionnel : BREVO_CONTACT_EN_USER_TEMPLATE_ID pour la page /en/contact.",
  "BREVO_CONTACT_FALLBACK_TEMPLATE_ID is set but CONTACT_FALLBACK_EMAIL is missing.":
    "BREVO_CONTACT_FALLBACK_TEMPLATE_ID est renseigné mais CONTACT_FALLBACK_EMAIL est manquant : les deux doivent être définis ensemble pour la copie par template.",
  "BREVO_SENDER_EMAIL is not configured.":
    "la variable BREVO_SENDER_EMAIL (expéditeur des emails Brevo) n'est pas définie ou est vide.",
  "BREVO_API_KEY is not configured.":
    "la variable BREVO_API_KEY n'est pas définie ou est vide.",
};

export function contactConfigUserMessage(
  verbose: boolean,
  configReason: string,
): string {
  if (!verbose) {
    return CONTACT_GENERIC_USER_FACING_MESSAGE;
  }

  const hint = CONFIG_REASON_HINTS[configReason] ?? configReason;
  return `Le service de contact n'est pas correctement configuré : ${hint}`;
}
