import { getBridgeRuntime } from "./runtime.js";
import type { BridgeClient, BridgeInboundEnvelope, WechatBridgeAccountConfig } from "./types.js";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function deepCollectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      out.push(trimmed);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      deepCollectStrings(item, out);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const key of ["text", "value", "content", "body", "message"]) {
      if (key in (value as Record<string, unknown>)) {
        deepCollectStrings((value as Record<string, unknown>)[key], out);
      }
    }
  }
}

function extractInboundText(event: BridgeInboundEnvelope): string | undefined {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const direct = [payload.text, payload.body, payload.content, payload.prompt, payload.message];
  for (const candidate of direct) {
    const text = readString(candidate);
    if (text) {
      return text;
    }
  }
  const collected: string[] = [];
  deepCollectStrings(payload, collected);
  return collected.join("\n").trim() || undefined;
}

function extractSender(event: BridgeInboundEnvelope): { id?: string; name?: string } {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const from = (event.from ?? payload.from ?? payload.sender ?? payload.user ?? {}) as Record<
    string,
    unknown
  >;
  return {
    id:
      readString(from.id) ??
      readString(from.userId) ??
      readString(from.senderId) ??
      readString(payload.fromId) ??
      readString(payload.senderId),
    name:
      readString(from.name) ??
      readString(from.nickname) ??
      readString(payload.fromName) ??
      readString(payload.senderName),
  };
}

function extractAssistantText(messages: unknown[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i] as Record<string, unknown>;
    if (message?.role !== "assistant") {
      continue;
    }
    const collected: string[] = [];
    deepCollectStrings(message.content, collected);
    deepCollectStrings(message.parts, collected);
    deepCollectStrings(message.text, collected);
    const text = collected.join("\n").trim();
    if (text) {
      return text;
    }
  }
  return undefined;
}

export async function handleInboundEvent(params: {
  cfg: any;
  account: WechatBridgeAccountConfig;
  event: BridgeInboundEnvelope;
  client: BridgeClient;
}): Promise<void> {
  const runtime = getBridgeRuntime();
  const sender = extractSender(params.event);
  const text = extractInboundText(params.event);

  if (!sender.id || !text) {
    console.warn("[wechat-bridge] skipping inbound event without sender/text", {
      accountId: params.account.accountId ?? "default",
      eventType: params.event.type,
    });
    return;
  }

  const route = runtime.channel.routing.resolveAgentRoute({
    cfg: params.cfg,
    channel: "wechat-bridge",
    accountId: params.account.accountId ?? "default",
    peer: {
      kind: "direct",
      id: sender.id,
    },
  });

  const storePath = runtime.channel.session.resolveStorePath(params.cfg);
  await runtime.channel.session.recordInboundSession({
    storePath,
    sessionKey: route.sessionKey,
    ctx: {
      Body: text,
      BodyForAgent: text,
      RawBody: text,
      CommandBody: text,
      BodyForCommands: text,
      From: sender.name ?? sender.id,
      To: sender.id,
      SessionKey: route.sessionKey,
      AccountId: route.accountId,
      SenderId: sender.id,
      SenderName: sender.name,
      ChatType: "direct",
      Provider: "wechat-bridge",
      Surface: "wechat-bridge",
      OriginatingChannel: "wechat-bridge",
      OriginatingTo: sender.id,
      Timestamp: Date.now(),
    },
    createIfMissing: true,
    updateLastRoute: {
      sessionKey: route.mainSessionKey,
      channel: "wechat-bridge",
      to: sender.id,
      accountId: route.accountId,
    },
    onRecordError(err) {
      console.error("[wechat-bridge] failed to record inbound session", err);
    },
  });

  const run = await runtime.subagent.run({
    sessionKey: route.sessionKey,
    message: text,
    deliver: false,
  });

  const waited = await runtime.subagent.waitForRun({
    runId: run.runId,
    timeoutMs: 120_000,
  });

  if (waited.status !== "ok") {
    throw new Error(
      `wechat-bridge subagent run did not complete successfully: ${waited.status}${waited.error ? ` (${waited.error})` : ""}`
    );
  }

  const session = await runtime.subagent.getSessionMessages({
    sessionKey: route.sessionKey,
    limit: 50,
  });

  const replyText =
    extractAssistantText(session.messages) ??
    "Received your message, but no assistant text was available yet.";

  await params.client.sendText({
    to: sender.id,
    text: replyText,
    accountId: route.accountId,
  });
}
