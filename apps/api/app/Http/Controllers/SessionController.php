<?php

namespace App\Http\Controllers;

use App\Models\Membership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class SessionController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $input = $request->validate(['email' => 'required|email|max:255', 'password' => 'required|string|max:200']);
        $key = 'login:'.hash('sha256', strtolower($input['email']).'|'.$request->ip());
        abort_if(RateLimiter::tooManyAttempts($key, 5), 429, 'Too many unsuccessful sign-in attempts. Please try again in a minute.');
        if (! Auth::attempt($input)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }
        RateLimiter::clear($key);
        $request->session()->regenerate();

        return response()->json(['data' => $this->identity($request)]);
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->identity($request)]);
    }

    private function identity(Request $request): array
    {
        return [
            'id' => $request->user()->id, 'name' => $request->user()->name, 'email' => $request->user()->email,
            'organizations' => Membership::where('user_id', $request->user()->id)->where('active', true)
                ->with('organization')->get()->map(fn ($member) => [
                    'id' => $member->organization_id, 'name' => $member->organization->name,
                    'slug' => $member->organization->slug, 'industry' => $member->organization->industry,
                    'membership_id' => $member->id, 'roles' => $member->roles,
                ])->values(),
        ];
    }

    public function demo(): JsonResponse
    {
        abort_unless(config('flowops.demo_mode') && app()->environment('local', 'testing'), 404);

        return response()->json(['data' => [
            'password' => 'FlowOpsDemo!2026',
            'accounts' => [
                ['name' => 'Alex Morgan', 'email' => 'alex@flowops.test', 'role' => 'Administrator & requester', 'initials' => 'AM'],
                ['name' => 'Maya Chen', 'email' => 'maya@flowops.test', 'role' => 'Manager approver', 'initials' => 'MC'],
                ['name' => 'Noah Williams', 'email' => 'noah@flowops.test', 'role' => 'Finance approver', 'initials' => 'NW'],
                ['name' => 'Sarah Lim', 'email' => 'sarah@flowops.test', 'role' => 'Requester', 'initials' => 'SL'],
            ],
        ]]);
    }
}
