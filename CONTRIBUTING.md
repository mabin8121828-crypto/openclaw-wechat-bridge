# Contributing

Thanks for contributing to `openclaw-wechat-bridge`.

This project is intentionally maintained as a clean-room bridge scaffold. Please keep changes small, reviewable, and safe to publish.

## Ground rules

- Do not copy code from extracted QClaw bundles.
- Do not commit private tokens, cookies, websocket URLs, login state, or local desktop state.
- Do not claim official Tencent or QClaw support.
- Prefer generic transport abstractions over product-specific hardcoding.

## Before you start

1. Read [README.md](README.md) for project scope.
2. Read [ROADMAP.md](ROADMAP.md) for the current implementation stages.
3. Read [docs/LOCAL_VALIDATION.md](docs/LOCAL_VALIDATION.md) and [docs/MOCK_BRIDGE.md](docs/MOCK_BRIDGE.md) if your change touches runtime behavior.

## Local setup

From the repository root:

```bash
npm install
npm run check
npm run smoke:test
```

## Preferred contribution shape

Good changes for this repo usually look like one of these:

- transport/runtime improvements
- inbound or outbound message handling fixes
- mock bridge enhancements
- docs and examples cleanup
- CI or repository tooling improvements

Please avoid mixing unrelated concerns in one pull request.

## Validation expectations

Before opening a PR, run:

```bash
npm run check
npm run smoke:test
```

If your change cannot be fully validated locally, explain exactly what was tested and what was not.

## Safety review

Every PR should be easy to answer "yes" to:

- Is this still clean-room?
- Is this safe to publish publicly?
- Does this avoid embedding private bridge credentials?
- Does this keep pairing logic separate from the public runtime path?

## Pull requests

- Keep PRs focused.
- Use the PR template.
- Link the issue you are addressing when applicable.
- Include short logs or screenshots only when they materially help.

## Issues

Please use:

- bug report template for reproducible defects
- feature request template for scoped improvements

If you are unsure whether something belongs in public scope, open an issue first before implementing it.
