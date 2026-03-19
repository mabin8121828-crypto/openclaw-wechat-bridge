---
name: openclaw-wechat-bridge
description: Configure, validate, and troubleshoot a WeChat bridge channel for OpenClaw. Use when transplanting a QClaw-style WeChat access flow into plain OpenClaw, wiring token/wsUrl-based channel config, designing a clean-room pairing helper, or packaging the result for GitHub release.
---

# OpenClaw WeChat Bridge

Use this skill to work on a clean-room WeChat bridge for OpenClaw.

## Quick Start

1. Treat the runtime channel and the QR pairing flow as separate concerns.
2. Read [architecture.md](./references/architecture.md) before making structural decisions.
3. Keep the plugin generic: it should accept `token` and `wsUrl`, not own a desktop login flow.

## Workflow

### 1. Decide the target

Pick one of these targets first:

- OpenClaw plugin runtime
- pairing helper contract
- config migration into `openclaw.json`
- GitHub packaging and release structure

If the request mixes them, split the work and keep the plugin runtime independent.

### 2. Wire the plugin

Use the scaffold under `packages/openclaw-wechat-access/`.

Key rules:

- keep provider-specific behavior behind interfaces
- do not assume a QClaw desktop shell exists
- do not claim QR login is implemented unless the helper is real

### 3. Handle pairing carefully

The bridge runtime needs only:

- `token`
- `wsUrl`

If those values are unavailable, stop and say the runtime is blocked on pairing credentials.

Do not fake a working QR login flow inside the plugin.

### 4. Validate in OpenClaw

Prefer a throwaway OpenClaw state dir first.

Validate:

- plugin loads
- channel appears
- config reload reacts to `token/wsUrl`
- gateway start/stop lifecycle is clean

### 5. Package for GitHub

Ship three things together:

- plugin package
- example config
- docs that explain pairing is separate

Do not publish extracted proprietary QClaw code.

## Resources

### references/

- [architecture.md](./references/architecture.md): architecture boundary between plugin runtime and QR pairing
