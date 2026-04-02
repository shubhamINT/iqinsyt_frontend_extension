# Troubleshooting

## Event Never Appears in Panel

Checks:

- Confirm content script is injected on the page (`manifest.json` matches `<all_urls>`).
- Confirm detection selectors can match the page DOM (`h1/h2/h3`, `[data-event]`, `[data-match]`, `[data-fixture]`, or title pattern).
- Wait for the 5-second timeout path and verify `DETECTION_FAILED` is emitted.

Likely outcome:

- UI should move to `manual` phase and allow manual submission.

## Analysis Stuck or Fails

Checks:

- Verify `REQUEST_ANALYSIS` is sent from side panel hook.
- Verify background worker receives message and calls `fetchInsight`.
- Confirm `VITE_BACKEND_URL` is set correctly at build time.
- Inspect network/API status mapping (`401`, `402`, other errors).

Likely UI results:

- `401` or missing token -> `AUTH_REQUIRED` reset.
- `402` -> plan-upgrade error message.
- other failures/timeouts -> generic retry error message.

## Unexpected Auth Resets

Checks:

- Validate stored token payload has valid JWT structure and `exp` claim.
- Confirm refresh endpoint behavior and response shape (`accessToken`, `refreshToken`).
- Check whether refresh failures are causing token clear.

## Result Renders but Some Sections Empty

Checks:

- Inspect `InsightResponse.sections` content from backend.
- UI intentionally renders `[Data unavailable for this section]` when a section is missing/empty.

## Message Handling Debug Path

- Content emit: `src/content/detector.ts`
- Background relay/orchestration: `src/background/index.ts`
- Side panel listeners: `src/hooks/useEventDetection.ts`, `src/hooks/useInsightQuery.ts`
- Reducer transitions: `src/sidepanel/App.tsx`
