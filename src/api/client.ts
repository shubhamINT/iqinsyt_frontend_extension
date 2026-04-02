import { getAccessToken } from '../auth/tokenManager.ts'
import type { InsightRequest, InsightResponse, AuthTokenResponse, UserPlanResponse } from './types.ts'
import type { DetectedEvent } from '../shared/types.ts'

const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string) { super(message); this.name = 'AuthError'; }
}

export class SubscriptionError extends Error {
  constructor(message: string) { super(message); this.name = 'SubscriptionError'; }
}

export class ApiError extends Error {
  constructor(message: string) { super(message); this.name = 'ApiError'; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

async function authedFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new AuthError('No token');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (response.status === 401) throw new AuthError('Session expired');
  if (response.status === 402) throw new SubscriptionError('Plan inactive');
  if (!response.ok) throw new ApiError(`Request failed: ${response.status}`);

  return response;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export async function fetchInsight(event: DetectedEvent): Promise<InsightResponse> {
  const body: InsightRequest = {
    eventTitle: sanitize(event.title),
    eventSource: event.source,
    timestamp: Date.now(),
  };

  const response = await authedFetch('/v1/insight', {
    method: 'POST',
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });

  return response.json() as Promise<InsightResponse>;
}

export async function fetchAuthToken(code: string): Promise<AuthTokenResponse> {
  const response = await fetch(`${BASE_URL}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) throw new ApiError(`Auth failed: ${response.status}`);
  return response.json() as Promise<AuthTokenResponse>;
}

export async function fetchUserPlan(): Promise<UserPlanResponse> {
  const response = await authedFetch('/v1/user/plan', { method: 'GET' });
  return response.json() as Promise<UserPlanResponse>;
}
