# dcc-mcp-desktop agent guide

This repository is the Tauri v2 desktop control plane for `dcc-mcp`.

## Working rules

- Keep the gateway contract aligned with `dcc-mcp-core`.
- Use the existing Magpie-inspired matte dark tokens. Avoid neon glow, purple-blue gradients, and decorative 3D effects.
- Keep DCC identity parameterized. Do not add Maya-only assumptions to shared code.
- Treat provisioning as a backup-first operation. Only remove entries owned by this application.
- Keep source code, identifiers, comments, and commit messages in English. User-facing UI copy may follow the product language defined in the PRD.
- Git commits use `loonghao <hal.long@outlook.com>` and the format `<type>: <message>`.

## Validation

Run `npm run build` for the frontend and `cargo check --manifest-path src-tauri/Cargo.toml` for the Rust shell when the local toolchain is available.
