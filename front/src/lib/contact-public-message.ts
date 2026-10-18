export const CONTACT_GENERIC_USER_FACING_MESSAGE =
  "Le formulaire de contact est momentanément indisponible.\nNous vous prions de nous excuser pour la gêne occasionnée.\nPour toute demande, merci de vous reporter aux coordonnées figurant dans les mentions légales.";

export function isContactErrorVerbose(): boolean {
  const v = process.env.CONTACT_ERROR?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function contactUserMessage(verbose: boolean, detailed: string): string {
  return verbose ? detailed : CONTACT_GENERIC_USER_FACING_MESSAGE;
}
