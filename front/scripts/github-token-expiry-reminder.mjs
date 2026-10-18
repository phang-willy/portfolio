/**
 * Le rappel d'expiration du GITHUB_TOKEN n'appelle plus Brevo.
 * Le backend vérifie le jeton, enregistre le mail dans email_queue, puis Brevo l'envoie.
 *
 * Planification : le backend, chaque jour à 02:05 UTC
 * (app.github-token-reminder.cron).
 */
console.log(
  "[github-token-expiry-reminder] Envoi géré par le backend après enregistrement dans email_queue. Aucun appel Brevo depuis le front.",
);
