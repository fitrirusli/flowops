<?php

// Router for PHP's local development server. Production must serve apps/api/public.
$public = realpath(__DIR__.'/../apps/api/public');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$candidate = realpath($public.'/'.ltrim(rawurldecode($path), '/'));
if ($path !== '/' && $candidate && str_starts_with($candidate, $public.DIRECTORY_SEPARATOR) && is_file($candidate)) {
    return false;
}
require $public.'/index.php';
