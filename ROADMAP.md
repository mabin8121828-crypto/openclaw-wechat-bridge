# Roadmap

This project is intentionally being built in layers.

## Stage 1: Public clean-room scaffold

Status: done

- OpenClaw plugin scaffold
- example `openclaw.json`
- Codex skill scaffold
- architecture notes
- public README with scope boundaries

## Stage 2: Runtime bridge implementation

Status: next

- implement a real WebSocket client in `packages/openclaw-wechat-access/src/index.ts`
- normalize bridge events into OpenClaw session prompts
- support outbound delivery from agent replies back to the bridge
- add startup and reconnect logging

## Stage 3: Isolated local validation

Status: privately validated, not yet fully documented in code

- run in a throwaway OpenClaw state directory
- validate gateway startup
- validate outbound send
- validate inbound receive and reply
- confirm no dependence on the QClaw desktop shell at runtime

## Stage 4: Pairing helper design

Status: design only

- define a credential-provider interface for `token` and `wsUrl`
- keep the helper separate from the runtime plugin
- document legal and operational constraints clearly
- avoid shipping proprietary desktop logic

## Stage 5: Public hardening

Status: future

- add tests for startup and message routing
- add example logs and troubleshooting guides
- add CI checks
- document operational security and secret handling

## Non-goals

- shipping extracted QClaw code
- claiming official Tencent or QClaw support
- embedding private endpoints or user credentials in the public repo
