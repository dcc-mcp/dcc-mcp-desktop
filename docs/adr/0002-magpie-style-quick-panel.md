# ADR 0002: Model the tray window as a Magpie-style quick panel

## Status

Accepted

## Context

The tray surface is used for quick status checks and short routing actions. A generic floating window wastes space and loses the relationship between the tray icon and the content it opens.

Magpie treats its tray surface as a quick panel. It shares the application UI, opens beside the tray icon, chooses the edge nearest the icon, closes on focus loss, and glides between compact tabs.

## Decision

Use Tauri's tray event position and rectangle in Rust to place the 380 × 540 panel. Open above a bottom taskbar and below a top taskbar, clamp the panel to the active monitor, and toggle it on a completed left click. Use CSS transitions for the panel entrance and tab changes. Keep Rust responsible for native window geometry and React responsible for panel content and motion.

## Consequences

- The tray interaction remains native to each desktop environment while the panel content stays cross-platform.
- The panel can be tested in a browser with the same React entry point.
- Dynamic panel height and richer tab glides can be added without changing the Rust contract.
