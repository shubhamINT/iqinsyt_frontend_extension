# Side Panel State Machine

Reducer and state live in `src/sidepanel/App.tsx` and use contracts from `src/shared/types.ts`.

## Phase Definitions

- `idle`: waiting for detection or user action.
- `detected`: an event exists and can be analyzed.
- `manual`: no event detected; manual entry is shown.
- `loading`: analysis request in-flight.
- `result`: analysis data rendered.
- `error`: failure state with dismiss action.

## Transition Diagram

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> detected: EVENT_DETECTED
  idle --> manual: DETECTION_FAILED
  manual --> detected: manual submit (EVENT_DETECTED)
  detected --> loading: REQUEST_ANALYSIS
  loading --> result: ANALYSIS_RESULT
  loading --> error: SHOW_ERROR
  result --> loading: REQUEST_ANALYSIS (rerun)
  error --> idle: DISMISS_ERROR
  idle --> idle: AUTH_REQUIRED (reset)
  detected --> idle: AUTH_REQUIRED
  manual --> idle: AUTH_REQUIRED
  loading --> idle: AUTH_REQUIRED
  result --> idle: AUTH_REQUIRED
  error --> idle: AUTH_REQUIRED
```

## Action Effects

- `EVENT_DETECTED`: stores `detectedEvent`, clears prior error.
- `DETECTION_FAILED`: switches UI to manual input phase.
- `REQUEST_ANALYSIS`: enters loading and clears error.
- `ANALYSIS_RESULT`: stores response payload and enters result phase.
- `SHOW_ERROR`: stores message and enters error phase.
- `DISMISS_ERROR`: clears error and returns to idle.
- `AUTH_REQUIRED`: resets full app state to initial unauthenticated state.
- `SET_USER`: updates user auth/plan metadata.
