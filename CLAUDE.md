# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IQinsyt Frontend Extension** is a Chrome Extension (Manifest V3) that provides a side panel UI for fetching AI-powered research on markets and events from sites like Kalshi, Polymarket, Metaculus, etc.

The extension is structured around **three separate runtime contexts** that communicate via message passing:
- **Side Panel** (React UI): User-facing interface in `src/sidepanel/`
- **Background**: Service worker handling auth, API calls, and orchestration in `src/background/`
- **Content**: Page-level detection and UI injection in `src/content/`

This separation is **intentional and critical** — Chrome Manifest V3 restricts what each context can do, so treating them as separate modules avoids coupling and permission bloat.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development server (rebuilds on changes)
pnpm dev

# Build for distribution
pnpm build

# Type check (no emit)
pnpm -s tsc --noEmit

# Lint with ESLint
pnpm lint

# Preview production build
pnpm preview
```

### Loading in Chrome

```bash
pnpm build
# → Go to chrome://extensions
# → Enable "Developer mode" (top right)
# → Click "Load unpacked"
# → Select the dist/ folder
```

## Architecture & Concepts

### Three Contexts, One App

| Context | Purpose | Lifecycle |
|---------|---------|-----------|
| **Content Script** | Runs in webpage tabs. Detects events (e.g., clicking a market on Kalshi), controls floating widget, and sends detection messages. | Auto-injected by manifest on target domains. |
| **Background Worker** | Privileged service worker. Receives detection messages, calls backend APIs, manages auth tokens, and relays research results back to the side panel. | Starts when extension loads; sleeps when idle. |
| **Side Panel** | React app rendered in browser side panel. Displays events, analysis results, and errors. Sends requests to background via messages. | Only active when side panel is open. |

### Message Flow

1. **Content detects event** → sends `MARKETS_DETECTED` message to background
2. **Background receives detection** → relays to side panel as `EVENT_DETECTED` action
3. **Side panel user clicks "Analyze"** → sends `REQUEST_ANALYSIS` message to background
4. **Background fetches research** → streams response back to side panel in chunks
5. **Side panel receives chunks** → updates UI state as research arrives

This pattern keeps side effects isolated and makes testing/debugging easier.

### State Management

**Side Panel State** lives in `src/sidepanel/App.tsx` as a reducer with these phases:
- `IDLE` → No event detected
- `AWAITING_ANALYSIS` → User clicked analyze, waiting for response
- `STREAMING_RESEARCH` → Backend is sending research chunks
- `RESEARCH_COMPLETE` → Research finished, display results
- `ERROR` → Error occurred (auth, API, network, etc.)

Actions are dispatched by hooks (`useEventDetection`, `useInsightQuery`, `useAuth`) and modify state immutably.

### Token & Auth Management

- Tokens stored in `chrome.storage.local` (persistent across sessions)
- `src/auth/tokenManager.ts` handles read/write and refresh logic
- Background handles token refresh transparently
- Side panel checks auth status via `useAuth()` hook on mount

If token is stale, the background service worker refreshes it automatically before calling APIs.

### Kalshi Detection (Site-Specific Logic)

All Kalshi DOM logic is **centralized in `src/content/sites/kalshi/parseMarket.ts`** — single source of truth for:
- Finding market tiles in the DOM
- Parsing title, ticker, probabilities
- Detecting when user lands on a detail page
- Auto-firing market detection on page load

The picker in `src/content/picker.ts` uses this module to highlight candidates and emit messages.

## Key Files & Responsibilities

### API Layer (`src/api/`)
- `client.ts` — Typed fetch wrapper; handles auth headers, errors, streaming responses
- `types.ts` — Request/response contracts for `/v1/research`, `/v1/auth/token`, `/v1/user/plan`

### Auth (`src/auth/`)
- `tokenManager.ts` — Manages token lifecycle: reads from storage, refreshes on demand, writes back

### Content Script (`src/content/`)
- `content-script.ts` — Entry point; sets up PING handler, auto-detection, picker activation
- `floatingWidget.ts` — DOM/CSS for floating panel trigger, manages open/close state
- `picker.ts` — Interactive element picker; highlights candidates, emits detection messages
- `sites/kalshi/parseMarket.ts` — Kalshi-specific DOM parsing and detection logic

### Background (`src/background/`)
- `index.ts` — Service worker router; listens for messages from content/sidepanel, orchestrates API calls and state relays

### Side Panel UI (`src/sidepanel/`)
- `App.tsx` — Root component with reducer, hook invocation, phase-based rendering
- `context.tsx` — Provides `AppContext` and `useAppContext()` hook for state access
- `main.tsx` — React bootstrap entrypoint
- `index.html` — HTML shell for side panel mount

### Components (`src/components/`)
- `StatusBar.tsx` — Header showing current phase and streaming indicator
- `EventCard.tsx` — Displays detected event; has "Analyze" button
- `ManualInput.tsx` — Fallback form for manual event entry
- `ResearchOutput.tsx` — Renders research sections and metadata
- `SectionBlock.tsx` — Individual collapsible research section
- `ErrorState.tsx` — Error display with dismiss action
- `StreamingStatus.tsx` — Real-time status during research streaming

### Hooks (`src/hooks/`)
- `useAuth.ts` — Syncs auth state; checks token, fetches user plan, handles logout
- `useEventDetection.ts` — Listens for `EVENT_DETECTED` messages from background
- `useInsightQuery.ts` — Triggers analysis request; handles response streaming and errors

### Shared Contracts (`src/shared/`)
- `types.ts` — Defines all message/action/state types used across contexts (import from here to avoid duplication)

## Environment Variables

Required for build and runtime:

- `VITE_BACKEND_URL` — Base URL of the backend (e.g., `https://api.example.com`)
- `VITE_API_KEY` *(optional)* — API key sent as `X-API-Key` header for `/v1/research` calls

Set in `.env` at project root or pass via build command:
```bash
VITE_BACKEND_URL=https://api.example.com VITE_API_KEY=your-key pnpm build
```

## TypeScript & Build Setup

- **Bundler**: Vite with `@vitejs/plugin-react`
- **Extension Plugin**: `@crxjs/vite-plugin` (rewrites manifest, handles entrypoints)
- **Compiler**: tsc + Babel with React Compiler preset
- **Linter**: ESLint with TypeScript and React Hooks configs
- **tsconfig.app.json**: Browser/app code under `src/`
- **tsconfig.node.json**: Build tooling (Vite config)
- **Targets**: ES2023, DOM, Chrome APIs

Strict mode is enabled: no unused variables, parameters, or unchecked side effects.

## Common Development Patterns

### Adding a New Message Type
1. Define in `src/shared/types.ts` (request and response types)
2. Add handler in `src/background/index.ts`
3. Add dispatch in side panel hook (e.g., `src/hooks/useInsightQuery.ts`)

### Testing Content Script Changes
- Make changes in `src/content/`
- Run `pnpm build`
- Reload extension in `chrome://extensions` (blue refresh button)
- Check DevTools console for errors

### Testing Background Changes
- Make changes in `src/background/`
- Run `pnpm build`
- Open `chrome://extensions` → IQinsyt → "Inspect views: service worker"
- Watch DevTools console while side panel sends messages

### Testing Side Panel Changes
- Make changes in `src/sidepanel/` or `src/components/`
- Run `pnpm dev` (fast reload with hot reload)
- Check console in side panel DevTools

### Handling API Errors
- All API errors are typed in `src/api/types.ts` (e.g., `UnauthorizedError`, `RateLimitError`)
- Background catches errors and sends them as `ERROR` action to side panel
- Side panel renders the error in `ErrorState` component

## Documentation

For deeper architectural details, see:
- `docs/README.md` — Docs index and reading order
- `docs/runtime-architecture.md` — Context lifecycle and responsibilities
- `docs/data-flow.md` — End-to-end message flows with Mermaid diagrams
- `docs/state-machine.md` — Side panel reducer phase transitions
- `docs/contracts.md` — Message and API contracts
- `docs/troubleshooting.md` — Debugging guide for common issues

## Important Notes

- **Don't share state across contexts directly** — always use message passing via `chrome.runtime.sendMessage()`
- **Content script has limited permissions** — no access to `chrome.storage` or background APIs; must go through background
- **Background service worker sleeps** — if you need persistent polling, use alarms or message-based triggers
- **Side panel HTML is separate** — manifest declares `src/sidepanel/index.html` as the side panel entry; changes to paths require manifest update
- **Manifest changes require rebuild** — editing `manifest.json` doesn't auto-reload in dev; run `pnpm build` and reload the extension
