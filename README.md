# dcc-mcp-desktop

Cross-platform desktop control plane for the `dcc-mcp` gateway. The client uses Tauri v2, React, TypeScript, and a Rust shell for tray behavior, gateway lifecycle, and local provisioning.

## Release scope

The first release is a Tauri v2 desktop shell around the real `dcc-mcp` gateway:

- Bundled `dcc-mcp-server` and `dcc-mcp-cli` sidecars pinned by SHA-256 in `config/sidecars.json`.
- Rust-owned gateway lifecycle with start, stop, restart, readiness probe, bounded logs, and exit cleanup.
- An existing gateway on `127.0.0.1:9765` is adopted instead of being replaced.
- Typed Tauri commands and a real HTTP/SSE client using the core gateway routes.
- Main window, 380 × 540 tray quick panel, routing graph, and live call stream.
- Windows NSIS/MSI, macOS DMG, and Linux AppImage/DEB release pipelines.

The sidecar binaries are downloaded and verified by CI into `src-tauri/binaries/` before every desktop build. Local development can prepare them with:

```powershell
node scripts/ci/fetch-sidecars.mjs x86_64-pc-windows-msvc
```

Supported targets are `x86_64-pc-windows-msvc`, `aarch64-apple-darwin`, `x86_64-apple-darwin`, and `x86_64-unknown-linux-gnu`.

## Validation

```powershell
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
node scripts/ci/check-version.mjs
```

Installer builds require the native WebKitGTK and packaging dependencies listed in `.github/workflows/release.yml`.

## Repository conventions

- Keep core code, identifiers, comments, and commit messages in English.
- Use `loonghao <hal.long@outlook.com>` as the Git author.
- Preserve third-party configuration with a `.bak` copy before provisioning changes.
