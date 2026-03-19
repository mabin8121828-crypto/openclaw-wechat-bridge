# Mock Bridge Guide

Use the mock bridge when you want to test the OpenClaw plugin runtime without a real WeChat bridge.

## What it gives you

- a local WebSocket bridge endpoint
- token-aware connection testing
- outbound frame logging
- synthetic inbound message injection

## Files

- `packages/openclaw-wechat-access/tools/mock-bridge-server.mjs`
- `packages/openclaw-wechat-access/tools/inject-mock-event.mjs`

## Start the mock bridge

From `packages/openclaw-wechat-access/`:

```bash
npm install
npm run mock:server
```

Defaults:

- WebSocket: `ws://127.0.0.1:8787`
- Control endpoint: `http://127.0.0.1:8788`

Optional env vars:

- `WECHAT_BRIDGE_TOKEN`
- `MOCK_BRIDGE_PORT`
- `MOCK_BRIDGE_CONTROL_PORT`

## Example OpenClaw config

```json
{
  "channels": {
    "wechat-bridge": {
      "enabled": true,
      "token": "dev-token",
      "wsUrl": "ws://127.0.0.1:8787"
    }
  }
}
```

If you set `WECHAT_BRIDGE_TOKEN=dev-token` before starting the mock bridge, the plugin can exercise the same token path as a real deployment.

## Inject an inbound message

In a second terminal, from `packages/openclaw-wechat-access/`:

```bash
npm run mock:inject -- hello from mock bridge
```

You can also type directly into the mock bridge terminal. Each line is broadcast as a synthetic inbound event.

## What to look for

- plugin connects successfully
- outbound `message.send` frames appear in mock bridge logs
- injected inbound messages produce OpenClaw session activity
- assistant replies are sent back as outbound frames
