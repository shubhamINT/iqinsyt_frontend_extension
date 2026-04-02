# IQinsyt Frontend Extension Docs

This folder is the focused documentation set for the extension frontend runtime (`content`, `background`, `sidepanel`).

## Start Here

1. Read [runtime-architecture.md](./runtime-architecture.md) for runtime boundaries and lifecycle.
2. Read [data-flow.md](./data-flow.md) for end-to-end message and API flow.
3. Read [state-machine.md](./state-machine.md) for side panel reducer phases and transitions.
4. Read [contracts.md](./contracts.md) for message/API contracts and validation checks.
5. Use [troubleshooting.md](./troubleshooting.md) for debugging failures.

## Audience

- Engineers onboarding to this extension frontend.
- Engineers debugging cross-context issues between content script, background worker, and side panel.
- Engineers updating auth, API, or message contracts.
