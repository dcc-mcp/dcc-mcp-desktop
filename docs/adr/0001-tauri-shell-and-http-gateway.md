# ADR 0001: Use a Tauri shell around a typed HTTP/SSE gateway client

## Status

Accepted

## Context

`dcc-mcp-desktop` needs a small cross-platform shell that can own a system tray icon, two windows, local process lifecycle, and filesystem provisioning. Gateway execution already has a process and network boundary in `dcc-mcp-core`.

## Decision

Use Tauri v2 for native window and tray behavior. Keep gateway calls in a TypeScript HTTP/SSE client and reserve Rust commands for native operations such as status probing, provisioning, bridge discovery, and window lifecycle.

## Consequences

- The frontend remains testable without a running DCC host.
- The sidecar lifecycle can evolve independently from React rendering.
- The desktop shell needs a platform-specific sidecar packaging step in Phase 2.
- The HTTP/SSE contract is explicit and can be exercised against a real gateway or a mock server.
