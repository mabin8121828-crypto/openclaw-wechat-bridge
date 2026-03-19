# Local Validation Guide

This document describes a safe validation flow for private local testing without publishing user credentials or state.

## Goal

Validate that a plain OpenClaw runtime can host a WeChat bridge plugin when valid bridge credentials already exist.

## Use an isolated state directory

Do not test against your main daily OpenClaw or QClaw state first.

Use a separate state directory so you can:

- change ports freely
- isolate plugin and channel config
- avoid damaging your main working setup
- inspect logs cleanly

## Minimum validation checklist

### 1. Gateway startup

Confirm:

- OpenClaw can read the isolated config
- the plugin loads without crashing
- the gateway health endpoint responds

### 2. Outbound test

Confirm:

- the bridge accepts a send request
- the plugin returns a success result
- logs include an outbound delivery event

### 3. Inbound test

Confirm:

- inbound bridge messages become OpenClaw session prompts
- the agent generates a final reply
- the plugin delivers that final reply back to the bridge

### 4. Session isolation

Confirm:

- the test session is stored in the isolated state directory
- main daily state remains untouched

## Required secrets

Private local tests may require:

- bridge token
- bridge websocket URL
- model API credentials

Do not commit any of those values.

Prefer:

- environment variables
- local-only config files
- ignored state directories

## Safe public documentation rule

When documenting private local validation publicly:

- describe the procedure
- describe expected outcomes
- omit real values
- omit user IDs, cookies, tokens, and private websocket endpoints unless you are sure they are safe to disclose

## Suggested next private steps

1. Add a real runtime implementation behind the public scaffold.
2. Re-run outbound and inbound tests in an isolated state directory.
3. Capture sanitized logs for documentation.
4. Only then expand the public README with runtime maturity details.
