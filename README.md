# OpenClaw WeChat Bridge

Clean-room scaffold for bringing a QClaw-style WeChat access flow into plain OpenClaw.

This repository is intentionally split into two parts:

- `packages/openclaw-wechat-access/`: an OpenClaw plugin skeleton that hosts a WeChat bridge channel
- `skill/openclaw-wechat-bridge/`: a Codex skill that helps install, configure, and troubleshoot the bridge

## Why this is split

The local QClaw install shows that the runtime channel itself is an OpenClaw plugin, but the QR-code login and pairing flow lives in QClaw's desktop shell and backend APIs. In practice that means:

- the OpenClaw side can be transplanted
- the QR pairing side must be recreated or replaced

So this repo does not pretend the QR login is already solved. It gives you a safe starting point:

1. a reusable OpenClaw plugin shape
2. a pairing-helper contract
3. a Codex skill for setup and ops

## Repository layout

```text
packages/
  openclaw-wechat-access/
    openclaw.plugin.json
    package.json
    src/
examples/
  openclaw.json
skill/
  openclaw-wechat-bridge/
    SKILL.md
    agents/openai.yaml
    references/architecture.md
```

## Current scope

Included:

- OpenClaw plugin skeleton
- config contract for `token` and `wsUrl`
- pairing-helper interface draft
- example OpenClaw config
- Codex skill for operating the bridge

Not included:

- Tencent QR login implementation
- Tencent private endpoints implementation
- extracted proprietary QClaw source

## Suggested GitHub positioning

Publish this as a clean-room bridge project:

- do not claim it is an official Tencent or QClaw component
- document that users must provide their own legal pairing flow or credentials
- keep the plugin runtime generic and transport-driven

## Next build steps

1. implement a real WebSocket bridge client in `src/index.ts`
2. add a separate pairing helper that can obtain or refresh `token/wsUrl`
3. test against a non-production OpenClaw state dir first
