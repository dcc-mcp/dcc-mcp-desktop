# dcc-mcp-desktop

Cross-platform desktop control plane for the `dcc-mcp` gateway. The client uses Tauri v2, React, TypeScript, and a Rust shell for tray behavior, gateway lifecycle, and local provisioning.

## Current scope

Phase 1 is implemented as a working UI shell.

- Main window based on the existing `gateway_center.tsx` prototype.
- Independent 380 × 540 tray window with routing graph and live call stream.
- Tray window follows Magpie's quick-panel behavior. It anchors beside the tray icon, chooses a top or bottom opening direction, hides on focus loss, and uses short CSS panel transitions.
- Mock lifecycle events for `connected`, `running`, `failed`, and `completed`.
- Typed gateway, agent, and marketplace contracts.
- HTTP/SSE client with bounded exponential reconnect.
- Rust command surface for gateway status, profiles, agent provisioning, DCC bridge discovery, marketplace sources, and window control.

## Development

```powershell
npm install
npm run tauri dev
```

The sidecar binaries are intentionally kept out of source control. Phase 2 will add platform-specific `dcc-mcp-gateway` and `dcc-mcp-cli` assets under `src-tauri/binaries/` and wire the lifecycle manager to them.

## Repository conventions

- Keep core code, identifiers, comments, and commit messages in English.
- Use `loonghao <hal.long@outlook.com>` as the Git author.
- Preserve third-party configuration with a `.bak` copy before provisioning changes.
