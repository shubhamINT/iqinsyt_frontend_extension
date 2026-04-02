# Contracts and Checks

## Chrome Runtime Message Contract

Defined in `src/shared/types.ts`.

- `EVENT_DETECTED`: `payload` is `DetectedEvent`
- `REQUEST_ANALYSIS`: `payload` is `DetectedEvent`
- `ANALYSIS_RESULT`: `payload` is `InsightResponse`
- `ANALYSIS_ERROR`: `payload` is user-facing error message string
- `DETECTION_FAILED`: no payload
- `AUTH_REQUIRED`: no payload

`DetectedEvent` shape:

- `title: string`
- `source: string`

## API Contract Used by Frontend

Defined in `src/api/types.ts` and consumed by `src/api/client.ts`.

- `POST /v1/insight` with `InsightRequest`
  - `eventTitle`
  - `eventSource`
  - `timestamp`
- `POST /v1/auth/token`
- `POST /v1/auth/refresh`
- `GET /v1/user/plan`

`InsightResponse` required fields used by UI:

- `requestId`, `cached`, `cachedAt?`
- `sections` (`eventSummary`, `keyVariables`, `historicalContext`, `currentDrivers`, `riskFactors`, `dataConfidence`, `dataGaps`)
- `dataRetrievalAvailable`, `generatedAt`

## Validation, Sanitization, and Error Normalization

- `sanitize()` strips HTML-like tags and truncates event title to 500 chars.
- `authedFetch()` enforces bearer token and maps HTTP statuses:
  - `401` -> `AuthError`
  - `402` -> `SubscriptionError`
  - other non-2xx -> `ApiError`
- `fetchInsight()` sets 12s timeout.
- Background maps errors to UI-safe messages/events:
  - `AuthError` -> `AUTH_REQUIRED`
  - `SubscriptionError` -> `ANALYSIS_ERROR` with plan-upgrade message
  - any other error -> `ANALYSIS_ERROR` with generic retry message

## Auth Token Lifecycle

Implemented in `src/auth/tokenManager.ts`.

- Tokens are stored in `chrome.storage.local` under `iqinsyt_auth`.
- Access token JWT `exp` claim is inspected before authed calls.
- If access token expires in under 60s, refresh is attempted via `/v1/auth/refresh`.
- Refresh failure clears stored tokens and returns `null`.
