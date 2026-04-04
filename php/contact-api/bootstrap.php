<?php

declare(strict_types=1);

/**
 * Chargé par les points d’entrée sous public/api/…
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/dotenv.php';
contact_api_load_dotenv();

$configPath = __DIR__ . '/config.php';
if (!is_readable($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'CONFIG',
        'message' => 'Fichier config.php manquant. Copiez config.example.php vers config.php.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/** @var array<string, mixed> $GLOBALS['CONTACT_CONFIG'] */
$GLOBALS['CONTACT_CONFIG'] = contact_merge_env_overrides(require $configPath);

if (!extension_loaded('curl')) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'PHP_CURL',
        'message' =>
            'Extension PHP curl requise (contactez votre hébergeur ou activez php-curl).',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function cfg(string $key, mixed $default = null): mixed
{
    $c = $GLOBALS['CONTACT_CONFIG'];
    return array_key_exists($key, $c) ? $c[$key] : $default;
}

function contact_data_dir(): string
{
    $override = getenv('CONTACT_DATA_DIR');
    if (is_string($override) && $override !== '') {
        $dir = $override;
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        return $dir;
    }

    if (is_dir(__DIR__ . '/public/data')) {
        $dir = __DIR__ . '/public/data';
    } elseif (is_dir(__DIR__ . '/data')) {
        $dir = __DIR__ . '/data';
    } else {
        $dir = __DIR__ . '/public/data';
    }
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    return $dir;
}

function is_contact_error_verbose(): bool
{
    $v = strtolower(trim((string) cfg('CONTACT_ERROR', '')));
    return $v === 'true' || $v === '1' || $v === 'yes';
}

function contact_generic_message(): string
{
    return 'Le formulaire de contact est momentanément indisponible. Nous vous prions de nous excuser pour la gêne occasionnée. Pour toute demande, merci de vous reporter aux coordonnées figurant dans les mentions légales.';
}

function contact_user_message(bool $verbose, string $detailed): string
{
    return $verbose ? $detailed : contact_generic_message();
}

function contact_config_user_message(bool $verbose, string $configReason): string
{
    if (!$verbose) {
        return contact_generic_message();
    }
    $hints = [
        'CONTACT_TO_EMAIL is not configured.' => 'la variable CONTACT_TO_EMAIL (adresse qui reçoit les messages du formulaire) n\'est pas définie ou est vide.',
        'BREVO_CONTACT_USER_TEMPLATE_ID is missing or invalid.' => 'la variable BREVO_CONTACT_USER_TEMPLATE_ID est absente ou n\'est pas un nombre entier valide (identifiant du template Brevo de confirmation visiteur).',
        'BREVO_CONTACT_FALLBACK_TEMPLATE_ID is set but CONTACT_FALLBACK_EMAIL is missing.' => 'BREVO_CONTACT_FALLBACK_TEMPLATE_ID est renseigné mais CONTACT_FALLBACK_EMAIL est manquant : les deux doivent être définis ensemble pour la copie par template.',
        'BREVO_SENDER_EMAIL is not configured.' => 'la variable BREVO_SENDER_EMAIL (expéditeur des emails Brevo) n\'est pas définie ou est vide.',
        'BREVO_API_KEY is not configured.' => 'la variable BREVO_API_KEY n\'est pas définie ou est vide.',
    ];
    $hint = $hints[$configReason] ?? $configReason;
    return 'Le service de contact n\'est pas correctement configuré : ' . $hint;
}

function escape_html(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cors_send_headers(): void
{
    $allowed = trim((string) cfg('CONTACT_ALLOWED_ORIGINS', ''));
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($allowed === '') {
        if ($origin !== '') {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        } else {
            header('Access-Control-Allow-Origin: *');
        }
    } else {
        $list = array_filter(array_map('trim', explode(',', $allowed)));
        foreach ($list as $base) {
            if ($origin === $base || ($base !== '' && str_starts_with($origin, $base))) {
                header('Access-Control-Allow-Origin: ' . $origin);
                header('Vary: Origin');
                break;
            }
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
}

function cors_handle_options(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        cors_send_headers();
        http_response_code(204);
        exit;
    }
}

function get_client_ip(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $first = trim(explode(',', $forwarded)[0]);
        if ($first !== '') {
            return $first;
        }
    }
    $real = trim((string) ($_SERVER['HTTP_X_REAL_IP'] ?? ''));
    if ($real !== '') {
        return $real;
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/** Fenêtre fixe par clé (fichier JSON), comme l’ancien rate-limit en mémoire Node */
function check_rate_limit(string $key, int $max, int $windowMs): array
{
    if ($max < 1 || $windowMs < 1000) {
        return ['ok' => true];
    }

    $safeKey = preg_replace('/[^a-zA-Z0-9_-]/', '_', $key);
    $path = contact_data_dir() . '/rate_' . $safeKey . '.json';
    $now = (int) (microtime(true) * 1000);

    $bucket = null;
    if (is_readable($path)) {
        $raw = file_get_contents($path);
        if ($raw !== false) {
            $bucket = json_decode($raw, true);
        }
    }

    if (!is_array($bucket) || !isset($bucket['count'], $bucket['windowStart'])) {
        $bucket = ['count' => 0, 'windowStart' => $now];
    }

    if ($now - (int) $bucket['windowStart'] >= $windowMs) {
        $bucket = ['count' => 1, 'windowStart' => $now];
        file_put_contents($path, json_encode($bucket), LOCK_EX);
        return ['ok' => true];
    }

    if ((int) $bucket['count'] >= $max) {
        $retryAfterMs = $windowMs - ($now - (int) $bucket['windowStart']);
        $sec = max(1, (int) ceil($retryAfterMs / 1000));
        return ['ok' => false, 'retryAfterSeconds' => $sec];
    }

    $bucket['count'] = (int) $bucket['count'] + 1;
    file_put_contents($path, json_encode($bucket), LOCK_EX);
    return ['ok' => true];
}

function rate_limit_contact(string $preset): array
{
    $ip = get_client_ip();
    $defaults = [
        'post' => [12, 900_000],
        'status' => [120, 60_000],
        'captcha' => [45, 60_000],
    ];
    [$defMax, $defWin] = $defaults[$preset] ?? [60, 60_000];

    $max = (int) cfg('CONTACT_RATE_LIMIT_' . strtoupper($preset) . '_MAX', $defMax);
    if ($max < 1) {
        $max = $defMax;
    }
    $windowMs = (int) cfg('CONTACT_RATE_LIMIT_' . strtoupper($preset) . '_WINDOW_MS', $defWin);
    if ($windowMs < 1000) {
        $windowMs = $defWin;
    }

    $key = 'contact:' . $preset . ':' . $ip;
    return check_rate_limit($key, $max, $windowMs);
}

function json_rate_limited(int $retryAfterSeconds): void
{
    $verbose = is_contact_error_verbose();
    http_response_code(429);
    header('Retry-After: ' . $retryAfterSeconds);
    echo json_encode([
        'ok' => false,
        'error' => 'RATE_LIMITED',
        'message' => contact_user_message(
            $verbose,
            'Trop de requêtes depuis cette adresse. Réessayez dans ' . $retryAfterSeconds . ' seconde(s).',
        ),
    ], JSON_UNESCAPED_UNICODE);
}

function get_captcha_secret(): string
{
    $s = trim((string) cfg('CONTACT_CAPTCHA_SECRET', ''));
    if ($s !== '') {
        return $s;
    }
    $b = trim((string) cfg('BREVO_API_KEY', ''));
    if ($b !== '') {
        return $b;
    }
    throw new RuntimeException('CONTACT_CAPTCHA_SECRET or BREVO_API_KEY is required for captcha.');
}

const CONTACT_CAPTCHA_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*-_=+?';
const CAPTCHA_TTL_MS = 15 * 60 * 1000;

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    $raw = base64_decode(strtr($data, '-_', '+/'), true);
    if ($raw === false) {
        throw new InvalidArgumentException('invalid base64url');
    }
    return $raw;
}

function generate_contact_captcha_code(int $length = 8): string
{
    $out = '';
    $max = strlen(CONTACT_CAPTCHA_CHARSET) - 1;
    for ($i = 0; $i < $length; $i++) {
        $out .= CONTACT_CAPTCHA_CHARSET[random_int(0, $max)];
    }
    return $out;
}

function create_signed_captcha_token(string $code): string
{
    $exp = (int) round(microtime(true) * 1000) + CAPTCHA_TTL_MS;
    $payload = json_encode(['c' => $code, 'e' => $exp], JSON_UNESCAPED_UNICODE);
    if ($payload === false) {
        throw new RuntimeException('json encode payload');
    }
    $secret = get_captcha_secret();
    $sig = hash_hmac('sha256', $payload, $secret, true);
    $sigB64 = base64url_encode($sig);
    $payloadB64 = base64url_encode($payload);
    return $payloadB64 . '.' . $sigB64;
}

/**
 * @return array{code: string, exp: int}|null
 */
function read_captcha_from_token(string $token): ?array
{
    $dot = strrpos($token, '.');
    if ($dot === false || $dot <= 0) {
        return null;
    }
    $payloadB64 = substr($token, 0, $dot);
    $sig = substr($token, $dot + 1);
    try {
        $payload = base64url_decode($payloadB64);
    } catch (Throwable) {
        return null;
    }
    $secret = get_captcha_secret();
    $expected = base64url_encode(hash_hmac('sha256', $payload, $secret, true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $data = json_decode($payload, true);
    if (!is_array($data) || !isset($data['c'], $data['e'])) {
        return null;
    }
    if (!is_string($data['c']) || !is_numeric($data['e'])) {
        return null;
    }
    $now = (int) round(microtime(true) * 1000);
    if ($now > (int) $data['e']) {
        return null;
    }
    return ['code' => $data['c'], 'exp' => (int) $data['e']];
}

function normalize_captcha_input(string $value): string
{
    return preg_replace('/\s+/', '', $value) ?? '';
}

function captcha_answer_matches(string $expectedCode, string $userInput): bool
{
    $a = $expectedCode;
    $b = normalize_captcha_input($userInput);
    return hash_equals($a, $b);
}
