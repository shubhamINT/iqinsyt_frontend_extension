# Data Flow

## Happy Path: Auto-Detection to Result

```mermaid
sequenceDiagram
  participant Page as Host Page DOM
  participant Content as Content Script
  participant BG as Background Worker
  participant API as Backend API
  participant Panel as Side Panel UI

  Content->>Page: Read headings/data attributes/title
  Content->>BG: EVENT_DETECTED {title, source}
  BG->>Panel: EVENT_DETECTED
  Panel->>BG: REQUEST_ANALYSIS
  BG->>API: POST /v1/insight (Bearer token)
  API-->>BG: InsightResponse
  BG-->>Panel: ANALYSIS_RESULT
  Panel->>Panel: phase = result
```

## Detection Fallback: Manual Input Path

```mermaid
sequenceDiagram
  participant Content as Content Script
  participant BG as Background Worker
  participant Panel as Side Panel UI

  Content->>Content: MutationObserver runs
  Content->>Content: 5s timeout expires with no match
  Content->>BG: DETECTION_FAILED
  Panel->>Panel: phase = manual
  Panel->>BG: REQUEST_ANALYSIS (manual event)
  BG-->>Panel: ANALYSIS_RESULT | ANALYSIS_ERROR
```

## Auth and Error Mapping Path

```mermaid
sequenceDiagram
  participant Panel as Side Panel UI
  participant BG as Background Worker
  participant Client as API Client
  participant Auth as Token Manager
  participant API as Backend API

  Panel->>BG: REQUEST_ANALYSIS
  BG->>Client: fetchInsight(event)
  Client->>Auth: getAccessToken()
  Auth-->>Client: token | null
  alt no token or 401
    Client-->>BG: throw AuthError
    BG-->>Panel: AUTH_REQUIRED
  else 402 subscription
    Client-->>BG: throw SubscriptionError
    BG-->>Panel: ANALYSIS_ERROR("Update your plan to continue.")
  else other API failures/timeouts
    Client-->>BG: throw ApiError
    BG-->>Panel: ANALYSIS_ERROR("Something went wrong. Try again.")
  else success
    Client->>API: POST /v1/insight
    API-->>Client: InsightResponse
    Client-->>BG: response
    BG-->>Panel: ANALYSIS_RESULT
  end
```

## Checks and Guards in Flow

- Event text is sanitized before request (`<...>` tags stripped, trimmed, max 500 chars).
- JWT expiry is checked before each authed request; refresh is attempted if near expiry (`< 60s`).
- Request timeout is enforced (`AbortSignal.timeout(12_000)`).
- UI receives normalized message types, not raw exceptions.
