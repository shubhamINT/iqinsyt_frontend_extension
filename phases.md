# IQinsyt Frontend Extension — Phased Implementation Plan

Each phase is fully independent in scope. A separate agent can be handed any phase with only the context listed under "Depends on." Phases do not overlap.

## Implementation Status (Current Repository)

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Build Infrastructure | Completed | CRX + manifest wiring is in place and build succeeds. |
| Phase 2 — Folder Skeleton & Entry Points | Completed | Side panel/background/content skeleton exists and compiles. |
| Phase 3 — Shared TypeScript Types | Completed (with contract drift) | `src/shared/types.ts` and `src/api/types.ts` exist, but naming/shapes differ from original plan text. |
| Phase 4 — Auth & API Client | Completed (with contract drift) | `src/auth/tokenManager.ts` and `src/api/client.ts` exist and compile, with implementation differences from original plan text. |
| Phase 5 — Background Service Worker & Content Script | Not started | Pending implementation. |
| Phase 6 — State Machine (Context + Reducer) | Not started | Pending implementation. |
| Phase 7 — Custom Hooks | Not started | Pending implementation. |
| Phase 8 — UI Components | Not started | Pending implementation. |
| Phase 9 — Final Wiring & Styling | Not started | Pending implementation. |

---

## Phase 1 — Build Infrastructure
**Goal:** Make the project build as a Chrome Extension instead of a plain web app.

### Files to change
| File | Action |
|---|---|
| `package.json` | Add `@crxjs/vite-plugin`, `@types/chrome` to devDependencies |
| `vite.config.ts` | Import and register `crx({ manifest })` plugin |
| `manifest.json` | Create at project root |

### manifest.json content (from architecture.md §4)
- `manifest_version: 3`, name `IQinsyt`
- `side_panel` → `sidepanel/index.html`
- `background` service worker → `src/background/index.ts`
- `content_scripts` → `src/content/index.ts`, matches `https://*/*`
- Permissions: `sidePanel`, `storage`, `activeTab`
- `host_permissions`: `https://api.iqinsyt.com/*`

### Verification
- `pnpm install` — no errors
- `pnpm build` — `dist/` contains `manifest.json`, side panel HTML, and CRX-generated background/content JS artifacts
- Load `dist/` as unpacked extension in Chrome — no errors in `chrome://extensions`

### Depends on
Nothing. This is the foundation.

### Status
Completed.

---

## Phase 2 — Folder Skeleton & Entry Points
**Goal:** Create the correct directory structure and replace the Vite boilerplate entry points with extension-appropriate ones.

### Files to create
| File | Content |
|---|---|
| `src/sidepanel/index.html` | Minimal HTML shell with `<div id="root">` and script tag pointing to `main.tsx` |
| `src/sidepanel/main.tsx` | React 19 `createRoot` mount — identical structure to current `src/main.tsx` but pointing to `sidepanel/App.tsx` |
| `src/sidepanel/App.tsx` | Empty shell: just `export default function App() { return <div>IQinsyt</div> }` |
| `src/background/index.ts` | Empty shell with a single `console.log('background ready')` |
| `src/content/index.ts` | Empty shell with a single `console.log('content ready')` |
| `src/content/detector.ts` | Empty export: `export {}` |

### Files to delete
- `src/App.tsx` — replaced by `src/sidepanel/App.tsx`
- `src/main.tsx` — replaced by `src/sidepanel/main.tsx`
- `src/App.css` — boilerplate
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` — boilerplate

### Files to clean
- `src/index.css` — remove all Vite template styles; keep only the CSS custom property definitions (`:root { --text: ...; --accent: ...; --bg: ...; }`)

### Verification
- `tsc --noEmit` — no type errors
- `pnpm build` — build succeeds, side panel entry is present in `dist/`
- Side panel renders "IQinsyt" text in Chrome

### Depends on
Phase 1 (build config must exist so `pnpm build` targets the right output)

### Status
Completed.

---

## Phase 3 — Shared TypeScript Types
**Goal:** Define all interfaces, enums, and types used across the entire codebase. No runtime logic — types only.

### Files to create
**`src/shared/types.ts`**
- `MessageType` enum: `EVENT_DETECTED`, `FETCH_INSIGHT`, `INSIGHT_RESULT`, `AUTH_TOKEN`, `ERROR`
- `AppState` type: `'idle' | 'detected' | 'loading' | 'result' | 'error'`
- `AppAction` discriminated union (for useReducer)
- `DetectedEvent` interface: `{ id, sport, teams, market, pageUrl, timestamp }`
- `ChromeMessage` interface: `{ type: MessageType, payload: unknown }`

**`src/api/types.ts`**
- `InsightRequest`: `{ eventId, query, userId }`
- `InsightResponse`: `{ sections: Section[], cached: boolean, latencyMs: number }`
- `Section`: `{ id, title, body, sources: Source[] }`
- `Source`: `{ url, title, publishedAt }`
- `AuthTokenResponse`: `{ accessToken, refreshToken, expiresIn }`
- `UserPlan`: `{ tier: 'free' | 'pro', queriesRemaining: number }`

### Verification
- `tsc --noEmit` — no errors
- No imports from other src files (this file IS the dependency, nothing else)

### Depends on
Phase 2 (folder structure must exist)

### Status
Completed (with contract drift from original plan).

### Current Implementation Notes
- Phase goal (shared type-only modules) is met via:
  - `src/shared/types.ts`
  - `src/api/types.ts`
- The implemented contract names and shapes currently differ from this section's original spec.
- Implemented message/event/state model currently uses:
  - `MessageType` as string-union values (`EVENT_DETECTED`, `REQUEST_ANALYSIS`, `ANALYSIS_RESULT`, `DETECTION_FAILED`, `AUTH_REQUIRED`)
  - `ExtensionMessage`, `DetectedEvent`, `AppPhase`, `AppState`, `AppAction`
- Implemented API model currently uses:
  - `InsightRequest` with `eventTitle`, `eventSource`, `timestamp`
  - `InsightResponse` with structured sections and metadata fields
  - `AuthTokenResponse`
  - `UserPlanResponse`

---

## Phase 4 — Auth & API Client
**Goal:** Implement the token manager and the API fetch wrapper. Pure TypeScript, no React.

### Files to create
**`src/auth/tokenManager.ts`**
- `getAccessToken()` — reads from `chrome.storage.local`
- `setTokens(access, refresh)` — writes to `chrome.storage.local`
- `clearTokens()` — removes tokens
- `refreshAccessToken()` — calls `/v1/auth/refresh`, stores new tokens on success

**`src/api/client.ts`**
- Base URL: `https://api.iqinsyt.com`
- `fetchInsight(req: InsightRequest): Promise<InsightResponse>` — POST `/v1/insight`
- `fetchAuthToken(code: string): Promise<AuthTokenResponse>` — POST `/v1/auth/token`
- `fetchUserPlan(): Promise<UserPlan>` — GET `/v1/user/plan`
- All calls attach `Authorization: Bearer <token>` via `tokenManager.getAccessToken()`
- On 401: call `refreshAccessToken()` and retry once

### Verification
- `tsc --noEmit` — no errors
- No browser/React runtime needed to import these modules

### Depends on
Phase 3 (imports from `src/shared/types.ts` and `src/api/types.ts`)

### Status
Completed (with contract drift from original plan).

### Current Implementation Notes
- Phase goal (auth/token manager + API client modules) is met via:
  - `src/auth/tokenManager.ts`
  - `src/api/client.ts`
- `tokenManager` currently implements:
  - `setTokens(access, refresh)`, `clearTokens()`, `getAccessToken()`
  - internal refresh flow (non-exported) that calls `/v1/auth/refresh`
  - JWT expiry check before returning access token
- `api/client` currently implements:
  - `fetchInsight(event: DetectedEvent)` (takes detected event directly, not `InsightRequest`)
  - `fetchAuthToken(code: string)`
  - `fetchUserPlan()`
  - `authedFetch` helper with typed error classes (`AuthError`, `SubscriptionError`, `ApiError`)
- Current runtime config uses `import.meta.env.VITE_BACKEND_URL` as base URL (instead of a hardcoded `https://api.iqinsyt.com`).
- 401 behavior currently throws `AuthError`; automatic refresh-retry orchestration is handled via token retrieval path rather than retry logic inside each client call.

---

## Phase 5 — Background Service Worker & Content Script
**Goal:** Implement Chrome message passing. The background worker routes messages; the content script detects events on the page.

### Files to implement
**`src/background/index.ts`**
- Listen on `chrome.runtime.onMessage`
- Route `FETCH_INSIGHT` → call `fetchInsight()` from api/client → reply with `INSIGHT_RESULT` or `ERROR`
- Route `AUTH_TOKEN` → call `fetchAuthToken()` → store tokens

**`src/content/detector.ts`**
- `startDetection()` — attaches a `MutationObserver` to `document.body`
- On each mutation: run DOM heuristics to detect sports/prediction-market pages
- If detected: extract `DetectedEvent` and send `chrome.runtime.sendMessage({ type: EVENT_DETECTED, payload: event })`
- Fallback: expose `window.__iqinsyt_manual__` for manual override

**`src/content/index.ts`**
- Import and call `startDetection()` on load

### Verification
- `tsc --noEmit` — no errors
- Load extension in Chrome, open a test page, check `chrome://extensions` service worker logs for messages

### Depends on
Phase 3 (MessageTypes, DetectedEvent), Phase 4 (api/client for background worker)

---

## Phase 6 — State Machine (Context + Reducer)
**Goal:** Implement the React state layer for the side panel. No UI components yet — just the data layer.

### Files to implement
**`src/sidepanel/App.tsx`** (replace the shell from Phase 2)
- Define `appReducer(state, action) => state` handling all `AppAction` variants
- Wrap tree in `AppContext.Provider` with `{ state, dispatch }`
- Render a placeholder `<div>` that shows current `state.status` (to verify state works)

State shape (from architecture.md §13):
```ts
{
  status: AppState,
  event: DetectedEvent | null,
  insight: InsightResponse | null,
  error: string | null,
  user: UserPlan | null,
}
```

### Verification
- `tsc --noEmit` — no errors
- Side panel shows current state name (`idle`) when loaded in Chrome

### Depends on
Phase 3 (AppState, AppAction, InsightResponse, DetectedEvent, UserPlan types)

---

## Phase 7 — Custom Hooks
**Goal:** Implement the 3 hooks that bridge Chrome messaging and React state.

### Files to create
**`src/hooks/useAuth.ts`**
- On mount: call `tokenManager.getAccessToken()` — if missing, dispatch `{ type: 'AUTH_REQUIRED' }`
- Expose `{ isAuthenticated, user, login, logout }`

**`src/hooks/useEventDetection.ts`**
- Listen on `chrome.runtime.onMessage` for `EVENT_DETECTED`
- On receive: dispatch `{ type: 'EVENT_DETECTED', payload: event }`
- On unmount: remove listener

**`src/hooks/useInsightQuery.ts`**
- Expose `fetchInsight(event: DetectedEvent)` function
- On call: dispatch `LOADING`, send `FETCH_INSIGHT` message to background
- Listen for `INSIGHT_RESULT` reply → dispatch `{ type: 'RESULT', payload }` or `{ type: 'ERROR', payload }`

### Verification
- `tsc --noEmit` — no errors
- Hooks can be imported in App.tsx without breaking the build

### Depends on
Phase 3 (types), Phase 4 (tokenManager), Phase 6 (AppContext dispatch)

---

## Phase 8 — UI Components
**Goal:** Build all 6 UI components. They read from `AppContext` and receive props — no direct API calls, no Chrome messaging.

### Files to create (all in `src/components/`)
| Component | Renders |
|---|---|
| `StatusBar.tsx` | Current status label + spinner when `status === 'loading'` |
| `EventCard.tsx` | Detected event info: sport, teams, market. Props: `DetectedEvent` |
| `ManualInput.tsx` | Text input + submit button for manual event entry when detection fails |
| `SectionBlock.tsx` | One research section: title + body + source links. Props: `Section` |
| `ResearchOutput.tsx` | Maps over `insight.sections` and renders `<SectionBlock>` for each |
| `ErrorState.tsx` | Error message display. Props: `{ message: string }` |

### Design rules (non-negotiable from architecture.md)
- No green or red colours
- No directional arrows
- No percentage/odds/probability language
- System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Fixed width ~400px (applied at the panel root, not per component)

### Verification
- `tsc --noEmit` — no errors
- Each component renders without errors when given mock props

### Depends on
Phase 3 (Section, DetectedEvent, InsightResponse types), Phase 6 (AppContext for reading state)

---

## Phase 9 — Final Wiring & Styling
**Goal:** Connect everything together. `App.tsx` uses all hooks and renders all components based on state. Add the side panel CSS.

### Changes to `src/sidepanel/App.tsx`
Replace the placeholder render with the real conditional rendering:
```
idle     → <StatusBar /> + <ManualInput />
detected → <StatusBar /> + <EventCard />
loading  → <StatusBar /> (spinner)
result   → <StatusBar /> + <EventCard /> + <ResearchOutput />
error    → <StatusBar /> + <ErrorState />
```
Call all three hooks inside `App`.

### CSS additions to `src/index.css`
- `#root` / `.panel`: `width: 400px`, system font, no colour other than neutral grays
- `StatusBar`, `EventCard`, `SectionBlock` layout styles
- Ensure no red/green anywhere

### Verification
- Full end-to-end: load extension → open side panel → visit a sports page → event is detected → insight loads → result renders
- `pnpm build` produces a clean `dist/`
- `tsc --noEmit` — zero errors
- Manual checklist from architecture.md §16 passes

### Depends on
All previous phases (this is the integration phase)
