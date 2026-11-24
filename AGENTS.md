# dcc-mcp-desktop agent guide

This repository is the Tauri v2 desktop control plane for `dcc-mcp`.

## Working rules

- Keep the gateway contract aligned with `dcc-mcp-core`.
- Use the existing Magpie-inspired matte dark tokens. Avoid neon glow, purple-blue gradients, and decorative 3D effects.
- Keep DCC identity parameterized. Do not add Maya-only assumptions to shared code.
- Treat provisioning as a backup-first operation. Only remove entries owned by this application.
- Keep source code, identifiers, comments, and commit messages in English. User-facing UI copy may follow the product language defined in the PRD.
- Git commits use the format `<type>: <message>` and the repository identity required by the project owner.

## Validation

Use the `vx` + `just` ecosystem as the single source of truth for local and CI tasks. Run `vx just validate` for the complete local gate. `vx.toml` declares tool versions only; all recipes live in the lowercase `justfile`.
