# OpenClaw WeChat Bridge

[![CI](https://github.com/mabin8121828-crypto/openclaw-wechat-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/mabin8121828-crypto/openclaw-wechat-bridge/actions/workflows/ci.yml)

Clean-room scaffold for bringing a QClaw-style WeChat access path into plain OpenClaw without shipping proprietary QClaw code or private desktop state.

This repository is intentionally split into two parts:

- `packages/openclaw-wechat-access/`: an OpenClaw plugin scaffold for a WeChat bridge channel
- `skill/openclaw-wechat-bridge/`: a Codex skill for installation, configuration, and troubleshooting

## Status

This repository is a public scaffold, not a finished production bridge.

What has been validated locally in a private test environment:

- plain OpenClaw can load a WeChat bridge plugin
- the bridge runtime can accept `token` and `wsUrl`
- an isolated OpenClaw state directory can send and receive messages when valid bridge credentials already exist

What the public repository now includes beyond the initial scaffold:

- a reconnecting WebSocket bridge client skeleton
- outbound `sendText` wiring for normalized message frames
- inbound frame parsing, session recording, and subagent-run hooks
- explicit separation between runtime transport and QR pairing

What is intentionally not included here:

- Tencent QR login implementation
- Tencent private endpoint logic
- extracted QClaw source bundles
- local user state, tokens, cookies, or pairing data

## Why the project is split

The local QClaw install strongly suggests the feature is divided into two layers:

1. an OpenClaw runtime plugin that handles channel transport
2. a desktop-side QR login and pairing flow that obtains bridge credentials

That means the runtime side can be modeled cleanly in OpenClaw, but the pairing side must be recreated, replaced, or provided by a separate legal credential flow.

This repository therefore gives you three safe starting pieces:

1. a reusable OpenClaw plugin shape
2. a pairing-helper contract
3. a Codex skill for setup and operations

## Repository layout

```text
docs/
  LOCAL_VALIDATION.md
  MOCK_BRIDGE.md
packages/
  openclaw-wechat-access/
    openclaw.plugin.json
    package.json
    src/
    tools/
examples/
  openclaw.json
skill/
  openclaw-wechat-bridge/
    SKILL.md
    agents/openai.yaml
    references/architecture.md
ROADMAP.md
tools/
```

## Included in this repository

- OpenClaw plugin scaffold
- config contract for `token` and `wsUrl`
- pairing-helper interface draft
- example OpenClaw config
- Codex skill for setup and ops
- architecture notes for a clean-room implementation path

## Explicitly not included

- official Tencent or QClaw binaries
- any claim of official support or affiliation
- code copied from extracted QClaw bundles
- default credentials, bridge tokens, or websocket endpoints

## Example config

See `examples/openclaw.json`.

The example expects you to provide:

- `WECHAT_BRIDGE_TOKEN`
- `WECHAT_BRIDGE_WS_URL`

## Quick local setup

From the repository root:

```bash
npm install
npm run check
npm run smoke:test
```

That gives you:

- workspace dependency install
- a basic repo-level sanity check
- a mock-bridge smoke test that exercises WebSocket connection, outbound ack, and injected inbound frames

The repository-level smoke test is currently passing in the local development environment.

## Recommended local validation flow

1. Test in an isolated OpenClaw state directory, not your primary state.
2. Load the plugin and confirm gateway startup first.
3. Validate outbound messaging with known-safe test content.
4. Validate inbound routing and replies.
5. Only after that, experiment with a separate pairing helper.

For a sanitized public checklist, see `docs/LOCAL_VALIDATION.md`.

For offline plugin testing without a real bridge, see `docs/MOCK_BRIDGE.md`.

## Project plan

See `ROADMAP.md` for the staged implementation plan.

For contribution expectations, see `CONTRIBUTING.md`.

For the first public issue slices, see `docs/ISSUE_BACKLOG.md`.

For disclosure expectations and repository security scope, see `SECURITY.md`.

## Suggested project positioning

Publish and describe this as a clean-room bridge project:

- do not claim it is an official Tencent or QClaw component
- document that users must provide their own legal credential source
- keep the transport runtime generic
- keep pairing logic optional and separate

## Practical next steps

1. Implement a real WebSocket bridge client in `src/index.ts`.
2. Define a credential-provider interface for `token/wsUrl`.
3. Add a local-only pairing helper prototype outside the public runtime path.
4. Add tests for gateway startup, outbound delivery, and inbound routing.
5. Exercise changes first against the local mock bridge.
