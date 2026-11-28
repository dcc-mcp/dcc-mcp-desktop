# ADR 0003: Bundle and own the dcc-mcp gateway sidecar

## Status

Accepted

## Context

The desktop shell must provide a working gateway without requiring users to install `dcc-mcp-core` separately. Core publishes `dcc-mcp-server` and the standalone CLI repository publishes `dccmcp` for Windows, macOS, and Linux. The gateway daemon listens on `127.0.0.1:9765` by default and exposes admin APIs under `/admin/api/*`.

## Decision

Bundle the independently pinned release binaries as Tauri external sidecars. The Rust shell owns the spawned `dcc-mcp-server gateway` process, keeps bounded stdout/stderr logs, and terminates it on application exit or explicit stop. If the well-known port is already healthy, the shell adopts that gateway and does not spawn a duplicate. Release workflows verify each binary with the SHA-256 digest from its publishing repository.

## Consequences

- A first-run user gets a local gateway without a separate installation step.
- Desktop releases must be rebuilt when either pinned version changes.
- A bundled sidecar is never treated as the owner of an unrelated healthy gateway.
- Signed installer credentials remain a deployment concern and do not change the process contract.
