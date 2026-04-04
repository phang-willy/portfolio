<?php

declare(strict_types=1);

function get_min_brevo_credits_required(): int
{
    $raw = trim((string) cfg('CONTACT_MIN_BREVO_CREDITS', ''));
    if ($raw === '') {
        return 2;
    }
    $n = (int) $raw;
    return ($n >= 1) ? $n : 2;
}

function parse_template_id(mixed $raw): ?int
{
    if ($raw === null || $raw === '') {
        return null;
    }
    $n = (int) $raw;
    return ($n >= 1) ? $n : null;
}

/**
 * @return array{ok: true, adminEmail: string, userTemplateId: int, adminTemplateId: int|null, fallbackEmail: string|null, fallbackTemplateId: int|null}|array{ok: false, reason: string}
 */
function get_contact_runtime_config(): array
{
    $adminEmail = trim((string) cfg('CONTACT_TO_EMAIL', ''));
    if ($adminEmail === '') {
        return ['ok' => false, 'reason' => 'CONTACT_TO_EMAIL is not configured.'];
    }

    $userTemplateId = parse_template_id(cfg('BREVO_CONTACT_USER_TEMPLATE_ID', null));
    if ($userTemplateId === null) {
        return ['ok' => false, 'reason' => 'BREVO_CONTACT_USER_TEMPLATE_ID is missing or invalid.'];
    }

    $adminRaw = cfg('BREVO_CONTACT_ADMIN_TEMPLATE_ID', 0);
    $adminTemplateId = parse_template_id($adminRaw);
    if ($adminRaw !== 0 && $adminRaw !== '0' && $adminTemplateId === null) {
        return ['ok' => false, 'reason' => 'BREVO_CONTACT_ADMIN_TEMPLATE_ID is invalid.'];
    }

    $fallbackEmail = trim((string) cfg('CONTACT_FALLBACK_EMAIL', ''));
    if ($fallbackEmail === '') {
        $fallbackEmail = null;
    }

    $fallbackTemplateId = parse_template_id(cfg('BREVO_CONTACT_FALLBACK_TEMPLATE_ID', 0));

    if ($fallbackTemplateId !== null && $fallbackEmail === null) {
        return ['ok' => false, 'reason' => 'BREVO_CONTACT_FALLBACK_TEMPLATE_ID is set but CONTACT_FALLBACK_EMAIL is missing.'];
    }

    $senderEmail = trim((string) cfg('BREVO_SENDER_EMAIL', ''));
    if ($senderEmail === '') {
        return ['ok' => false, 'reason' => 'BREVO_SENDER_EMAIL is not configured.'];
    }

    if (trim((string) cfg('BREVO_API_KEY', '')) === '') {
        return ['ok' => false, 'reason' => 'BREVO_API_KEY is not configured.'];
    }

    return [
        'ok' => true,
        'adminEmail' => $adminEmail,
        'userTemplateId' => $userTemplateId,
        'adminTemplateId' => $adminTemplateId,
        'fallbackEmail' => $fallbackEmail,
        'fallbackTemplateId' => $fallbackTemplateId,
    ];
}

function brevo_curl(string $method, string $url, ?array $jsonBody): array
{
    $apiKey = trim((string) cfg('BREVO_API_KEY', ''));
    $ch = curl_init($url);
    $headers = [
        'accept: application/json',
        'api-key: ' . $apiKey,
    ];
    if ($jsonBody !== null) {
        $headers[] = 'content-type: application/json';
    }
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ];
    if ($method === 'GET') {
        $opts[CURLOPT_HTTPGET] = true;
    } else {
        $opts[CURLOPT_CUSTOMREQUEST] = $method;
        if ($jsonBody !== null) {
            $opts[CURLOPT_POSTFIELDS] = json_encode($jsonBody, JSON_UNESCAPED_UNICODE);
        }
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno !== 0 || $raw === false) {
        return ['ok' => false, 'status' => 0, 'body' => curl_strerror($errno) ?: 'curl error'];
    }
    return ['ok' => $code >= 200 && $code < 300, 'status' => $code, 'body' => (string) $raw];
}

function brevo_get_account(): array
{
    $r = brevo_curl('GET', 'https://api.brevo.com/v3/account', null);
    if (!$r['ok']) {
        throw new RuntimeException('Brevo account: HTTP ' . $r['status'] . ' ' . $r['body']);
    }
    $decoded = json_decode($r['body'], true);
    return is_array($decoded) ? $decoded : [];
}

function brevo_send_smtp_email(array $payload): array
{
    $r = brevo_curl('POST', 'https://api.brevo.com/v3/smtp/email', $payload);
    if (!$r['ok']) {
        throw new RuntimeException('Brevo smtp: HTTP ' . $r['status'] . ' ' . $r['body']);
    }
    $decoded = json_decode($r['body'], true);
    return is_array($decoded) ? $decoded : [];
}

function get_brevo_sender_from_env(): array
{
    $email = trim((string) cfg('BREVO_SENDER_EMAIL', ''));
    $name = trim((string) cfg('BREVO_SENDER_NAME', ''));
    $out = ['email' => $email];
    if ($name !== '') {
        $out['name'] = $name;
    }
    return $out;
}

/** @return int|null */
function extract_send_limit_credits(mixed $plan): ?int
{
    if (!is_array($plan)) {
        return null;
    }
    $highest = null;
    foreach ($plan as $item) {
        if (!is_array($item)) {
            continue;
        }
        if (($item['creditsType'] ?? '') !== 'sendLimit') {
            continue;
        }
        $rawCredits = $item['credits'] ?? null;
        $n = null;
        if (is_numeric($rawCredits)) {
            $n = (float) $rawCredits;
        }
        if ($n !== null) {
            $highest = $highest === null ? $n : max($highest, $n);
        }
    }
    return $highest === null ? null : (int) floor($highest);
}

/**
 * @return array{canSubmit: true, creditsRemaining: int|null, minCreditsRequired: int}|array{canSubmit: false, reason: string, message: string, creditsRemaining?: int|null, minCreditsRequired?: int}
 */
function evaluate_contact_health_from_account(array $accountBody): array
{
    $minCreditsRequired = get_min_brevo_credits_required();

    $relay = $accountBody['relay'] ?? null;
    if (is_array($relay) && array_key_exists('enabled', $relay) && $relay['enabled'] === false) {
        return [
            'canSubmit' => false,
            'reason' => 'RELAY_DISABLED',
            'message' => 'L\'envoi d\'emails transactionnels est désactivé sur le compte Brevo. Le formulaire de contact est indisponible.',
            'minCreditsRequired' => $minCreditsRequired,
        ];
    }

    $creditsRemaining = extract_send_limit_credits($accountBody['plan'] ?? null);

    if ($creditsRemaining !== null && $creditsRemaining < $minCreditsRequired) {
        return [
            'canSubmit' => false,
            'reason' => 'QUOTA',
            'message' => 'Le quota d\'envoi d\'emails est insuffisant pour traiter une demande (il reste ' . (int) floor($creditsRemaining) . ' crédit(s), ' . $minCreditsRequired . ' sont nécessaires pour confirmer votre message et prévenir l\'administrateur).',
            'creditsRemaining' => $creditsRemaining,
            'minCreditsRequired' => $minCreditsRequired,
        ];
    }

    return [
        'canSubmit' => true,
        'creditsRemaining' => $creditsRemaining,
        'minCreditsRequired' => $minCreditsRequired,
    ];
}

/**
 * @return array{canSubmit: true, creditsRemaining: int|null, minCreditsRequired: int}|array{canSubmit: false, reason: string, message: string, creditsRemaining?: int|null, minCreditsRequired?: int}
 */
function fetch_contact_health_snapshot(): array
{
    try {
        $account = brevo_get_account();
        return evaluate_contact_health_from_account($account);
    } catch (Throwable $e) {
        $verbose = is_contact_error_verbose();
        if ($verbose) {
            return [
                'canSubmit' => false,
                'reason' => 'BREVO_ERROR',
                'message' => 'L\'API Brevo (GET /v3/account) a échoué. ' . $e->getMessage(),
                'minCreditsRequired' => get_min_brevo_credits_required(),
            ];
        }
        return [
            'canSubmit' => false,
            'reason' => 'BREVO_ERROR',
            'message' => 'Le service d\'email ne répond pas ou la clé API est refusée. Le formulaire de contact est temporairement indisponible.',
            'minCreditsRequired' => get_min_brevo_credits_required(),
        ];
    }
}

function notify_quota_fallback_if_needed(float|int $creditsRemaining, int $minRequired): void
{
    $to = trim((string) cfg('CONTACT_FALLBACK_EMAIL', ''));
    if ($to === '') {
        return;
    }

    $cooldown = (int) cfg('CONTACT_FALLBACK_ALERT_COOLDOWN_MS', 21600000);
    $path = contact_data_dir() . '/quota_alert_last.txt';
    $now = (int) (microtime(true) * 1000);
    if ($cooldown > 0 && is_readable($path)) {
        $last = (int) trim((string) file_get_contents($path));
        if ($now - $last < $cooldown) {
            return;
        }
    }

    try {
        $sender = get_brevo_sender_from_env();
        $subject = '[Portfolio] Alerte quota Brevo — formulaire contact bloqué';
        $html = '<!DOCTYPE html><html lang="fr"><body style="font-family:system-ui,sans-serif;line-height:1.5">'
            . '<p>Le formulaire de contact a été désactivé côté site : les crédits d\'envoi Brevo (sendLimit) sont trop bas.</p>'
            . '<ul><li>Crédits restants (sendLimit) : <strong>' . escape_html((string) floor($creditsRemaining)) . '</strong></li>'
            . '<li>Minimum requis par demande : <strong>' . escape_html((string) $minRequired) . '</strong></li></ul>'
            . '<p>Réapprovisionnez le compte Brevo ou augmentez le plafond pour réactiver le formulaire.</p>'
            . '</body></html>';

        brevo_send_smtp_email([
            'sender' => $sender,
            'to' => [['email' => $to]],
            'subject' => $subject,
            'htmlContent' => $html,
        ]);
        file_put_contents($path, (string) $now, LOCK_EX);
    } catch (Throwable) {
        /* évite de casser le GET */
    }
}

/**
 * @param array{firstName: string, lastName: string, email: string, phone: string, company?: string, title: string, message: string} $data
 */
function build_admin_email_html(array $data): string
{
    $e = 'escape_html';
    $company = $data['company'] ?? '';
    $rows = [
        ['Prénom', $e($data['firstName'])],
        ['Nom', $e($data['lastName'])],
        ['Email', $e($data['email'])],
        ['Téléphone', $e($data['phone'])],
        ['Entreprise', $company !== '' ? $e($company) : $e('—')],
        ['Titre', $e($data['title'])],
        ['Message', nl2br($e($data['message']), false)],
    ];
    $listItems = '';
    foreach ($rows as $row) {
        $listItems .= '<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;vertical-align:top;">'
            . $row[0] . '</td><td style="padding:8px 12px;border:1px solid #ddd;">' . $row[1] . '</td></tr>';
    }
    return '<!DOCTYPE html><html lang="fr"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">'
        . '<p style="font-size:16px;margin:0 0 12px;">Nouveau message depuis le formulaire de contact.</p>'
        . '<table style="border-collapse:collapse;max-width:640px;">' . $listItems . '</table></body></html>';
}

function build_admin_subject(array $data): string
{
    $subject = '[Contact] ' . $data['lastName'] . ' ' . $data['firstName'];
    $subject = preg_replace('/[\r\n\x00-\x08\x0b\x0c\x0e-\x1f]/', ' ', $subject) ?? $subject;
    return mb_substr(trim($subject), 0, 998);
}

/**
 * @param array{firstName: string, lastName: string, email: string, phone: string, company?: string, title: string, message: string} $data
 * @return array<string, string>
 */
function template_params_from_payload(array $data): array
{
    return [
        'FIRSTNAME' => $data['firstName'],
        'LASTNAME' => $data['lastName'],
        'EMAIL' => $data['email'],
        'PHONE_NUMBER' => $data['phone'],
        'COMPANY' => $data['company'] ?? '',
        'TITLE' => $data['title'],
        'MESSAGE' => $data['message'],
    ];
}

/**
 * @return array{ok: true, data: array}|array{ok: false, issues: list<array{path: list<string>, message: string}>}
 */
function validate_contact_submission_body(array $body): array
{
    $phoneRegex = '/^[\d\s+().\-\/]+$/u';

    $issues = [];

    $str = static function (mixed $v): string {
        return is_string($v) ? trim($v) : '';
    };

    $firstName = $str($body['firstName'] ?? null);
    if ($firstName === '') {
        $issues[] = [['firstName'], 'Le prénom est requis.'];
    } elseif (mb_strlen($firstName) > 100) {
        $issues[] = [['firstName'], 'Le prénom est trop long.'];
    }

    $lastName = $str($body['lastName'] ?? null);
    if ($lastName === '') {
        $issues[] = [['lastName'], 'Le nom est requis.'];
    } elseif (mb_strlen($lastName) > 100) {
        $issues[] = [['lastName'], 'Le nom est trop long.'];
    }

    $email = $str($body['email'] ?? null);
    if ($email === '') {
        $issues[] = [['email'], 'L\'adresse email est requise.'];
    } elseif (mb_strlen($email) > 320) {
        $issues[] = [['email'], 'L\'adresse email est trop longue.'];
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $issues[] = [['email'], 'Adresse email invalide.'];
    }

    $phone = $str($body['phone'] ?? null);
    if ($phone === '') {
        $issues[] = [['phone'], 'Le téléphone est requis.'];
    } elseif (mb_strlen($phone) > 40) {
        $issues[] = [['phone'], 'Le téléphone est trop long.'];
    } elseif (!preg_match($phoneRegex, $phone)) {
        $issues[] = [['phone'], 'Format de téléphone invalide.'];
    }

    $companyRaw = $str($body['company'] ?? null);
    if (mb_strlen($companyRaw) > 200) {
        $issues[] = [['company'], 'Le nom de l\'entreprise est trop long.'];
    }
    $company = $companyRaw === '' ? null : $companyRaw;

    $title = $str($body['title'] ?? null);
    if ($title === '') {
        $issues[] = [['title'], 'Le titre est requis.'];
    } elseif (mb_strlen($title) > 200) {
        $issues[] = [['title'], 'Le titre est trop long.'];
    }

    $message = $str($body['message'] ?? null);
    if ($message === '') {
        $issues[] = [['message'], 'Le message est requis.'];
    } elseif (mb_strlen($message) > 10000) {
        $issues[] = [['message'], 'Le message est trop long.'];
    }

    $captchaRaw = $body['captcha'] ?? null;
    $captcha = is_string($captchaRaw) ? normalize_captcha_input($captchaRaw) : '';
    if ($captcha === '') {
        $issues[] = [['captcha'], 'Recopiez le code affiché.'];
    }

    $captchaToken = $str($body['captchaToken'] ?? null);
    if ($captchaToken === '') {
        $issues[] = [['captchaToken'], 'Jeton de vérification manquant. Générez un nouveau code.'];
    }

    if ($issues !== []) {
        $outIssues = [];
        foreach ($issues as $iss) {
            $outIssues[] = ['path' => $iss[0], 'message' => $iss[1]];
        }
        return ['ok' => false, 'issues' => $outIssues];
    }

    $data = [
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'phone' => $phone,
        'title' => $title,
        'message' => $message,
        'captcha' => $captcha,
        'captchaToken' => $captchaToken,
    ];
    if ($company !== null) {
        $data['company'] = $company;
    }

    return ['ok' => true, 'data' => $data];
}

/**
 * @param array{canSubmit: true, creditsRemaining: int|null, minCreditsRequired: int}|array{canSubmit: false, reason: string, message: string, creditsRemaining?: int|null, minCreditsRequired?: int} $health
 */
function contact_status_json(array $health): array
{
    $verbose = is_contact_error_verbose();
    if ($health['canSubmit']) {
        return [
            'canSubmit' => true,
            'creditsRemaining' => $health['creditsRemaining'],
            'minCreditsRequired' => $health['minCreditsRequired'],
        ];
    }
    return [
        'canSubmit' => false,
        'reason' => $health['reason'],
        'message' => contact_user_message($verbose, $health['message']),
        'creditsRemaining' => $health['creditsRemaining'] ?? null,
        'minCreditsRequired' => $health['minCreditsRequired'] ?? get_min_brevo_credits_required(),
    ];
}

function is_contact_post_origin_allowed(): bool
{
    $raw = trim((string) cfg('CONTACT_ALLOWED_ORIGINS', ''));
    if ($raw === '') {
        return true;
    }
    $allowed = array_filter(array_map('trim', explode(',', $raw)));
    if ($allowed === []) {
        return true;
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return true;
    }
    foreach ($allowed as $base) {
        if ($origin === $base || ($base !== '' && str_starts_with($origin, $base))) {
            return true;
        }
    }
    return false;
}

function assert_post_body_size_allowed(): bool
{
    $cl = $_SERVER['CONTENT_LENGTH'] ?? '';
    if ($cl === '') {
        return true;
    }
    $n = (int) $cl;
    if ($n < 0) {
        return true;
    }
    return $n <= 48 * 1024;
}

function handle_get_contact(): void
{
    cors_send_headers();

    $rl = rate_limit_contact('status');
    if (!$rl['ok']) {
        json_rate_limited($rl['retryAfterSeconds']);
        return;
    }

    $config = get_contact_runtime_config();
    if (!$config['ok']) {
        echo json_encode([
            'canSubmit' => false,
            'reason' => 'CONFIG',
            'message' => contact_config_user_message(is_contact_error_verbose(), $config['reason']),
            'creditsRemaining' => null,
            'minCreditsRequired' => get_min_brevo_credits_required(),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $health = fetch_contact_health_snapshot();

    if (
        !$health['canSubmit']
        && ($health['reason'] ?? '') === 'QUOTA'
        && isset($health['creditsRemaining'])
        && is_numeric($health['creditsRemaining'])
    ) {
        notify_quota_fallback_if_needed(
            (float) $health['creditsRemaining'],
            (int) ($health['minCreditsRequired'] ?? get_min_brevo_credits_required()),
        );
    }

    echo json_encode(contact_status_json($health), JSON_UNESCAPED_UNICODE);
}

function handle_post_contact(): void
{
    cors_send_headers();

    $verbose = is_contact_error_verbose();

    $rlPost = rate_limit_contact('post');
    if (!$rlPost['ok']) {
        http_response_code(429);
        header('Retry-After: ' . $rlPost['retryAfterSeconds']);
        echo json_encode([
            'ok' => false,
            'error' => 'RATE_LIMITED',
            'message' => contact_user_message(
                $verbose,
                'Trop de requêtes depuis cette adresse. Réessayez dans ' . $rlPost['retryAfterSeconds'] . ' seconde(s).',
            ),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!is_contact_post_origin_allowed()) {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'FORBIDDEN_ORIGIN',
            'message' => contact_user_message($verbose, 'La requête a été refusée (origine non autorisée).'),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (!assert_post_body_size_allowed()) {
        http_response_code(413);
        echo json_encode([
            'ok' => false,
            'error' => 'PAYLOAD_TOO_LARGE',
            'message' => contact_user_message($verbose, 'Le corps de la requête est trop volumineux.'),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $config = get_contact_runtime_config();
    if (!$config['ok']) {
        http_response_code(503);
        echo json_encode([
            'ok' => false,
            'error' => 'SERVER_MISCONFIGURED',
            'message' => contact_config_user_message($verbose, $config['reason']),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $health = fetch_contact_health_snapshot();
    if (!$health['canSubmit']) {
        http_response_code(503);
        echo json_encode([
            'ok' => false,
            'error' => 'CONTACT_UNAVAILABLE',
            'reason' => $health['reason'],
            'message' => contact_user_message($verbose, $health['message']),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'INVALID_JSON',
            'message' => contact_user_message($verbose, 'Le corps de la requête n\'est pas un JSON valide.'),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $body = json_decode($raw, true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'INVALID_JSON',
            'message' => contact_user_message($verbose, 'Le corps de la requête n\'est pas un JSON valide.'),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $parsed = validate_contact_submission_body($body);
    if (!$parsed['ok']) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'issues' => $parsed['issues'],
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $submission = $parsed['data'];
    $captchaPayload = read_captcha_from_token($submission['captchaToken']);

    if (
        $captchaPayload === null
        || !captcha_answer_matches($captchaPayload['code'], $submission['captcha'])
    ) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'error' => 'VALIDATION_ERROR',
            'issues' => [[
                'path' => ['captcha'],
                'message' => 'Le code ne correspond pas ou a expiré. Générez un nouveau code et recopiez-le exactement.',
            ]],
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    $data = [
        'firstName' => $submission['firstName'],
        'lastName' => $submission['lastName'],
        'email' => $submission['email'],
        'phone' => $submission['phone'],
        'title' => $submission['title'],
        'message' => $submission['message'],
    ];
    if (isset($submission['company'])) {
        $data['company'] = $submission['company'];
    }

    $sender = get_brevo_sender_from_env();
    $contactName = trim($data['firstName'] . ' ' . $data['lastName']);
    $replyTo = ['email' => $data['email'], 'name' => $contactName !== '' ? $contactName : null];
    if ($replyTo['name'] === null) {
        unset($replyTo['name']);
    }
    $params = template_params_from_payload($data);

    try {
        if ($config['adminTemplateId'] !== null) {
            $payload = [
                'sender' => $sender,
                'to' => [['email' => $config['adminEmail']]],
                'templateId' => $config['adminTemplateId'],
                'params' => $params,
                'replyTo' => $replyTo,
            ];
            brevo_send_smtp_email($payload);
        } else {
            brevo_send_smtp_email([
                'sender' => $sender,
                'to' => [['email' => $config['adminEmail']]],
                'subject' => build_admin_subject($data),
                'htmlContent' => build_admin_email_html($data),
                'replyTo' => $replyTo,
            ]);
        }
    } catch (Throwable $e) {
        error_log('[contact] Admin email failed: ' . $e->getMessage());
        $detail = 'Échec lors de l\'envoi vers l\'administrateur : ' . $e->getMessage();
        http_response_code(502);
        echo json_encode([
            'ok' => false,
            'error' => 'MAIL_ADMIN_FAILED',
            'message' => contact_user_message($verbose, $detail),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    if ($config['fallbackEmail'] !== null && $config['fallbackTemplateId'] !== null) {
        try {
            brevo_send_smtp_email([
                'sender' => $sender,
                'to' => [['email' => $config['fallbackEmail']]],
                'templateId' => $config['fallbackTemplateId'],
                'params' => $params,
                'replyTo' => $replyTo,
            ]);
        } catch (Throwable $e) {
            error_log('[contact] Fallback template failed: ' . $e->getMessage());
            http_response_code(502);
            echo json_encode([
                'ok' => false,
                'error' => 'MAIL_FALLBACK_FAILED',
                'message' => contact_user_message(
                    $verbose,
                    'Votre message a été notifié sur la boîte principale, mais l\'envoi de la copie vers l\'adresse secondaire (template fallback) a échoué côté Brevo.',
                ),
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
    }

    try {
        $userTo = ['email' => $data['email'], 'name' => $data['firstName'] !== '' ? $data['firstName'] : null];
        if ($userTo['name'] === null) {
            unset($userTo['name']);
        }
        brevo_send_smtp_email([
            'sender' => $sender,
            'to' => [$userTo],
            'templateId' => $config['userTemplateId'],
            'params' => $params,
        ]);
    } catch (Throwable $e) {
        error_log('[contact] User template failed: ' . $e->getMessage());
        http_response_code(502);
        echo json_encode([
            'ok' => false,
            'error' => 'MAIL_USER_FAILED',
            'message' => contact_user_message(
                $verbose,
                'Votre message a bien été transmis à l\'administrateur, mais l\'email de confirmation (template Brevo) n\'a pas pu être envoyé à votre adresse.',
            ),
        ], JSON_UNESCAPED_UNICODE);
        return;
    }

    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
}

function handle_get_captcha(): void
{
    cors_send_headers();

    $rl = rate_limit_contact('captcha');
    if (!$rl['ok']) {
        json_rate_limited($rl['retryAfterSeconds']);
        return;
    }

    try {
        $code = generate_contact_captcha_code();
        $captchaToken = create_signed_captcha_token($code);
        echo json_encode(['code' => $code, 'captchaToken' => $captchaToken], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $e) {
        error_log('[contact/captcha] ' . $e->getMessage());
        http_response_code(503);
        echo json_encode(['ok' => false, 'error' => 'CAPTCHA_UNAVAILABLE'], JSON_UNESCAPED_UNICODE);
    }
}
