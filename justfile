set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]
set shell := ["sh", "-cu"]

default:
    @just --list

install:
    vx node scripts/ci/npm-install.mjs
    vx node scripts/ci/node-env.mjs node node_modules/esbuild/install.js

dev: install
    vx node scripts/ci/node-env.mjs npm run tauri dev

build-frontend: install
    vx node node_modules/typescript/bin/tsc -b
    vx node node_modules/vite/bin/vite.js build

test-frontend: install
    vx node --test tests/*.test.mjs

fetch-sidecars target:
    vx node scripts/ci/fetch-sidecars.mjs {{target}}

fetch-sidecars-windows:
    just fetch-sidecars x86_64-pc-windows-msvc

fetch-sidecars-macos-arm64:
    just fetch-sidecars aarch64-apple-darwin

fetch-sidecars-macos-x64:
    just fetch-sidecars x86_64-apple-darwin

fetch-sidecars-linux:
    just fetch-sidecars x86_64-unknown-linux-gnu

check-versions:
    vx node scripts/ci/check-version.mjs

check-rust:
    vx cargo check --manifest-path src-tauri/Cargo.toml

fmt-check:
    vx cargo fmt --manifest-path src-tauri/Cargo.toml -- --check

clippy target="x86_64-unknown-linux-gnu":
    just fetch-sidecars {{target}}
    vx cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

test-rust target="x86_64-unknown-linux-gnu":
    just fetch-sidecars {{target}}
    vx cargo test --manifest-path src-tauri/Cargo.toml

test: test-frontend test-rust check-versions

lint: fmt-check clippy

build: build-frontend check-rust

validate target="x86_64-unknown-linux-gnu": build-frontend lint test check-rust

desktop-smoke target: install
    just fetch-sidecars {{target}}
    vx node scripts/ci/node-env.mjs npm run tauri build -- --target {{target}} --no-bundle

desktop-bundle target bundles: install
    just fetch-sidecars {{target}}
    vx node scripts/ci/node-env.mjs npm run tauri build -- --target {{target}} --bundles {{bundles}}

verify-bundle platform target="":
    vx node scripts/ci/verify-bundle.mjs {{platform}} {{target}}

contract-check:
    @vx just --list
    @vx node scripts/ci/check-repo-contract.mjs
