<?php

use App\Http\Middleware\RequestContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();
        $middleware->append(RequestContext::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->render(function (Throwable $error, Request $request) {
            if (! $request->is('api/*', 'login', 'logout') && ! $request->expectsJson()) {
                return null;
            }
            $status = match (true) {
                $error instanceof ValidationException => 422,
                $error instanceof AuthenticationException => 401,
                $error instanceof ModelNotFoundException => 404,
                $error instanceof HttpExceptionInterface => $error->getStatusCode(),
                default => 500,
            };

            return response()->json([
                'message' => $status >= 500 ? 'Something went wrong. Please try again or contact the maintainer with the request ID.' : ($status === 404 ? 'This resource is not available.' : $error->getMessage()),
                'code' => match ($status) {
                    401 => 'unauthenticated', 403 => 'forbidden', 404 => 'not_found', 409 => 'conflict', 419 => 'session_expired', 422 => 'validation_failed', 429 => 'rate_limited', default => 'request_failed'
                },
                'errors' => $error instanceof ValidationException ? $error->errors() : null,
                'request_id' => $request->attributes->get('request_id'),
            ], $status);
        });
    })->create();
