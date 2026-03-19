# Architecture Notes

## What the local QClaw install suggests

The inspected QClaw installation separates the feature into two layers:

1. an OpenClaw runtime plugin that handles the channel connection
2. a desktop-side QR login and device pairing flow that obtains bridge credentials

The plugin layer appears to need only:

- `token`
- `wsUrl`

## What this means for a clean-room GitHub project

Treat the project as two deliverables:

1. `openclaw-wechat-access` runtime plugin
2. a separate pairing helper or credential provider

Do not hard-code desktop-shell assumptions into the plugin.

## Recommended implementation order

1. get the OpenClaw plugin loading cleanly
2. accept `token/wsUrl` from env vars or config
3. validate basic gateway lifecycle
4. only then add a pairing helper

## Safe assumptions

- The plugin can be open-sourced
- The pairing flow should stay abstract until you are sure you can legally and reliably recreate it
- For public GitHub release, document the bridge contract instead of embedding proprietary app logic
