# Runtime Architecture

## Context Boundaries

The extension runs in three isolated contexts, each with separate capabilities.

- `content` (`src/content/content-script.ts`, `src/content/detector.ts`): reads host-page DOM, detects events, emits detection messages.
- `background` (`src/background/index.ts`): service worker that routes messages and performs privileged API orchestration.
- `sidepanel` (`src/sidepanel/*`): React UI state machine and rendering layer.

This separation is required by Manifest V3 and is also the reason all communication happens through `chrome.runtime` messaging.

## Entrypoints

- `manifest.json -> background.service_worker`: `src/background/index.ts`
- `manifest.json -> content_scripts.js`: `src/content/content-script.ts`
- `manifest.json -> side_panel.default_path`: `src/sidepanel/index.html`

## Responsibility Split

- Content script:
  - Parse DOM using heuristic selectors and title patterns.
  - Stop observing once an event is found.
  - Emit `DETECTION_FAILED` after timeout when no event is found.
- Background service worker:
  - Enable open-on-action side panel behavior.
  - Relay `EVENT_DETECTED` messages to side panel listeners.
  - Handle `REQUEST_ANALYSIS` by calling API client.
  - Normalize error outcomes into message types the UI can consume.
- Side panel:
  - Own local reducer state and phase transitions.
  - Subscribe to runtime messages via hooks.
  - Trigger analysis requests through background, never direct privileged orchestration.

## Lifecycle Notes

- Background is non-persistent (MV3 service worker lifecycle), so message handlers must stay stateless and deterministic.
- Side panel hooks attach listeners on mount and remove listeners on unmount.
- Content detection performs immediate parse first, then MutationObserver, then timeout fallback.
