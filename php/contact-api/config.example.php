<?php

/**
 * Copier ce fichier en config.php et renseigner les valeurs (ou laisser vide).
 * config.php n’est pas versionné (voir .gitignore).
 *
 * Les mêmes clés peuvent être définies dans un fichier **.env** à la racine du
 * projet (même emplacement que pour Next.js : parent du dossier `php/`), ou
 * dans `public_html/.env` si tu déploies le site à la racine du domaine.
 * Les variables d’environnement (dont le .env chargé par `dotenv.php`) **remplacent**
 * les valeurs ci-dessous. Pour forcer un chemin précis : variable serveur
 * `CONTACT_DOTENV_PATH` (chemin absolu vers le fichier .env).
 */
return [
    // Brevo (obligatoire)
    'BREVO_API_KEY' => '',
    'BREVO_SENDER_EMAIL' => '',
    'BREVO_SENDER_NAME' => '',

    // Destinataire admin + templates
    'CONTACT_TO_EMAIL' => '',
    'BREVO_CONTACT_USER_TEMPLATE_ID' => 0,
    /** Optionnel : template pour l’admin ; 0 = email HTML généré par le script */
    'BREVO_CONTACT_ADMIN_TEMPLATE_ID' => 0,
    /** Copie secondaire (optionnel) */
    'CONTACT_FALLBACK_EMAIL' => '',
    'BREVO_CONTACT_FALLBACK_TEMPLATE_ID' => 0,

    /** Secret captcha (sinon BREVO_API_KEY sert de secret HMAC, comme en TS) */
    'CONTACT_CAPTCHA_SECRET' => '',

    /** Quota : crédits sendLimit minimum pour accepter une demande (défaut 2) */
    'CONTACT_MIN_BREVO_CREDITS' => 2,

    /**
     * Origines autorisées pour les POST (séparées par des virgules), ex. :
     * https://www.monsite.fr,https://monsite.fr
     * Vide = pas de contrôle d’origine (comme l’ancien code Node).
     */
    'CONTACT_ALLOWED_ORIGINS' => '',

    /** true / 1 / yes = messages d’erreur détaillés côté client */
    'CONTACT_ERROR' => '',

    /** Cooldown alerte quota (ms), défaut 6 h */
    'CONTACT_FALLBACK_ALERT_COOLDOWN_MS' => 21600000,

    // Rate limits (optionnel, défauts = ancien code Node)
    'CONTACT_RATE_LIMIT_POST_MAX' => 12,
    'CONTACT_RATE_LIMIT_POST_WINDOW_MS' => 900000,
    'CONTACT_RATE_LIMIT_STATUS_MAX' => 120,
    'CONTACT_RATE_LIMIT_STATUS_WINDOW_MS' => 60000,
    'CONTACT_RATE_LIMIT_CAPTCHA_MAX' => 45,
    'CONTACT_RATE_LIMIT_CAPTCHA_WINDOW_MS' => 60000,
];
