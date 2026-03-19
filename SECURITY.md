# Security Policy

## Scope

This repository is a clean-room bridge scaffold. It is public by design and must stay safe to publish.

The following are always considered sensitive and must never be committed:

- bridge tokens
- websocket endpoints tied to private accounts
- cookies
- desktop app login state
- local OpenClaw or QClaw user state
- proprietary QClaw source bundles or extracted code

## Supported security posture

We currently support responsible disclosure for:

- accidental secret exposure in repository files
- unsafe defaults in examples or docs
- mock bridge behavior that could encourage insecure usage
- transport/runtime behavior that could leak credentials or message content

This repository does not provide official Tencent or QClaw credentials, pairing flows, or hosted bridge infrastructure.

## Reporting a vulnerability

Please do not open a public issue for credential leaks or security-sensitive bugs.

Instead:

1. Email the maintainer privately or use GitHub private reporting if enabled.
2. Include the smallest reproducible description possible.
3. Redact tokens, cookies, ws URLs, and local filesystem details before sending logs.

## Safe disclosure expectations

- Give maintainers reasonable time to assess and patch.
- Do not publish live credentials, private endpoints, or local state captures.
- Prefer minimal proof-of-concept material over full exploit detail in public.

## Hard rules for contributors

- Never add real bridge credentials to tests, docs, or examples.
- Keep pairing flows separate from public runtime code unless they are independently lawful and clean-room.
- When in doubt, file a private report first.
