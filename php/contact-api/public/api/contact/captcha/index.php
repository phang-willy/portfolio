<?php

declare(strict_types=1);

$bootstrapDirs = [
    dirname(__DIR__, 3),
    dirname(__DIR__, 4),
];
$loaded = false;
foreach ($bootstrapDirs as $dir) {
    $bootstrap = $dir . DIRECTORY_SEPARATOR . 'bootstrap.php';
    if (is_readable($bootstrap)) {
        require $bootstrap;
        require $dir . DIRECTORY_SEPARATOR . 'contact_handlers.php';
        $loaded = true;
        break;
    }
}
if (!$loaded) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        [
            'ok' => false,
            'error' => 'BOOTSTRAP',
            'message' =>
                'bootstrap.php introuvable. Placez bootstrap.php et contact_handlers.php dans public_html/ ou dans le dossier parent de public_html.',
        ],
        JSON_UNESCAPED_UNICODE,
    );
    exit;
}

cors_handle_options();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    cors_send_headers();
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], JSON_UNESCAPED_UNICODE);
    exit;
}

handle_get_captcha();
