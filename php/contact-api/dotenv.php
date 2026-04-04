<?php

declare(strict_types=1);

/**
 * Charge un fichier .env (format KEY=VALUE) dans l’environnement PHP (getenv / putenv).
 * Cherche par défaut le même .env qu’à la racine du projet Next (parent de php/).
 */

function contact_api_resolve_dotenv_path(): ?string
{
    $candidates = [];

    $fromEnv = getenv('CONTACT_DOTENV_PATH');
    if ($fromEnv !== false && $fromEnv !== '') {
        $candidates[] = $fromEnv;
    }

    // php/contact-api/ -> deux niveaux au-dessus = racine du repo (ex. portfolio/.env)
    $base = dirname(__DIR__, 2);
    $candidates[] = $base . DIRECTORY_SEPARATOR . '.env';
    // Déploiement type FTP : .env à la racine web (public_html)
    $candidates[] = $base . DIRECTORY_SEPARATOR . 'public_html' . DIRECTORY_SEPARATOR . '.env';

    foreach ($candidates as $path) {
        if (is_readable($path) && is_file($path)) {
            return $path;
        }
    }

    return null;
}

/**
 * Parse minimal d’un .env (lignes # commentées ignorées, guillemets simples/doubles).
 *
 * @return list<array{0: string, 1: string}>
 */
function contact_api_parse_dotenv_lines(string $content): array
{
    $out = [];
    $lines = preg_split("/\r\n|\n|\r/", $content) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }
        $key = trim(substr($line, 0, $eq));
        if ($key === '') {
            continue;
        }
        $value = trim(substr($line, $eq + 1));
        if ($value !== '' && ($value[0] === '"' || $value[0] === "'")) {
            $q = $value[0];
            $end = strrpos($value, $q);
            if ($end !== false && $end > 0) {
                $value = substr($value, 1, $end - 1);
            }
        }
        $out[] = [$key, $value];
    }
    return $out;
}

function contact_api_load_dotenv_file(string $path): void
{
    $raw = file_get_contents($path);
    if ($raw === false) {
        return;
    }
    foreach (contact_api_parse_dotenv_lines($raw) as [$key, $value]) {
        if (getenv($key) !== false) {
            continue;
        }
        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
    }
}

function contact_api_load_dotenv(): void
{
    $path = contact_api_resolve_dotenv_path();
    if ($path !== null) {
        contact_api_load_dotenv_file($path);
    }
}

/**
 * Surcharge la config PHP avec les variables d’environnement (dont celles issues du .env).
 *
 * @param array<string, mixed> $config
 * @return array<string, mixed>
 */
function contact_merge_env_overrides(array $config): array
{
    foreach ($config as $key => $default) {
        $v = getenv($key);
        if ($v === false) {
            continue;
        }
        if (is_int($default)) {
            if ($v === '') {
                continue;
            }
            $config[$key] = (int) $v;
        } else {
            $config[$key] = $v;
        }
    }
    return $config;
}
