import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { BridgeWebSocketClient } from "./client.js";
import { handleInboundEvent } from "./inbound.js";
import { setBridgeRuntime } from "./runtime.js";
import type {
  BridgeClient,
  BridgeInboundEnvelope,
  NormalizedChatType,
  WechatBridgeAccountConfig,
  WechatBridgeRootConfig,
} from "./types.js";

const clients = new Map<string, BridgeClient>();

function isRunning(state?: string): boolean {
  return state === "connected" || state === "connecting" || state === "reconnecting";
}

function resolveRootConfig(cfg: any): WechatBridgeRootConfig {
  return cfg?.channels?.["wechat-bridge"] ?? {};
}

function resolveAccountConfig(cfg: any, accountId: string): WechatBridgeAccountConfig {
  const root = resolveRootConfig(cfg);
  const account = root.accounts?.[accountId];
  return {
    accountId,
    token: account?.token ?? root.token,
    wsUrl: account?.wsUrl ?? root.wsUrl,
  };
}

function createBridgeClient(cfg: any, config: WechatBridgeAccountConfig): BridgeClient {
  if (!config.token || !config.wsUrl) {
    throw new Error("wechat-bridge requires both token and wsUrl");
  }

  return new BridgeWebSocketClient(config, {
    onConnected() {
      console.log("[wechat-bridge] websocket connected", {
        accountId: config.accountId ?? "default",
      });
    },
    onDisconnected(reason) {
      console.warn("[wechat-bridge] websocket disconnected", {
        accountId: config.accountId ?? "default",
        reason: reason ?? "unknown",
      });
    },
    onError(error) {
      console.error("[wechat-bridge] websocket error", {
        accountId: config.accountId ?? "default",
        message: error.message,
      });
    },
    onWarning(message) {
      console.warn("[wechat-bridge] warning", {
        accountId: config.accountId ?? "default",
        message,
      });
    },
    onEvent(event: BridgeInboundEnvelope) {
      console.log("[wechat-bridge] inbound event", {
        accountId: config.accountId ?? "default",
        type: event.type,
        hasPayload: typeof event.payload !== "undefined",
      });
      const client = clients.get(config.accountId ?? "default");
      if (!client) {
        console.warn("[wechat-bridge] inbound event received before client registration", {
          accountId: config.accountId ?? "default",
        });
        return;
      }
      void handleInboundEvent({
        cfg,
        account: config,
        event,
        client,
      }).catch((error) => {
        console.error("[wechat-bridge] inbound handling failed", {
          accountId: config.accountId ?? "default",
          message: error instanceof Error ? error.message : String(error),
        });
      });
    },
  });
}

const meta = {
  id: "wechat-bridge",
  label: "WeChat Bridge",
  selectionLabel: "WeChat Bridge",
  detailLabel: "WeChat Bridge",
  docsPath: "/channels/wechat-bridge",
  docsLabel: "wechat-bridge",
  blurb: "WeChat access channel bridged into OpenClaw.",
  systemImage: "message.fill",
  order: 86,
};

const channelPlugin = {
  id: "wechat-bridge",
  meta,
  capabilities: {
    chatTypes: ["direct"] as NormalizedChatType[],
    reactions: false,
    threads: false,
    media: true,
    nativeCommands: false,
    blockStreaming: false,
  },
  reload: {
    configPrefixes: [
      "channels.wechat-bridge.token",
      "channels.wechat-bridge.wsUrl",
      "channels.wechat-bridge.accounts",
    ],
  },
  config: {
    listAccountIds: (cfg: any) => {
      const accounts = resolveRootConfig(cfg).accounts;
      const ids = accounts ? Object.keys(accounts) : [];
      return ids.length > 0 ? ids : ["default"];
    },
    resolveAccount: (cfg: any, accountId: string) => resolveAccountConfig(cfg, accountId),
  },
  outbound: {
    deliveryMode: "direct" as const,
    sendText: async (ctx: any) => {
      const accountId = ctx.accountId ?? "default";
      const client = clients.get(accountId);
      if (!client) {
        return {
          ok: false,
          error: new Error(`wechat-bridge client not running for account ${accountId}`),
        };
      }
      await client.sendText({
        to: ctx.to,
        text: ctx.text,
        accountId,
        replyToId: ctx.replyToId ?? null,
        threadId: ctx.threadId ?? null,
        mediaUrl: ctx.mediaUrl,
      });
      return { ok: true };
    },
  },
  status: {
    buildAccountSnapshot: ({ accountId }: { accountId?: string }) => {
      const client = clients.get(accountId ?? "default");
      return { running: isRunning(client?.getState()) };
    },
  },
  gateway: {
    startAccount: async (ctx: any) => {
      const accountId = ctx.accountId ?? "default";
      const config = resolveAccountConfig(ctx.cfg, accountId);
      const client = createBridgeClient(ctx.cfg, config);
      clients.set(accountId, client);
      client.start();
      ctx.setStatus({ running: true });

      await new Promise<void>((resolve) => {
        ctx.abortSignal.addEventListener("abort", () => {
          client.stop();
          if (clients.get(accountId) === client) {
            clients.delete(accountId);
          }
          ctx.setStatus({ running: false });
          resolve();
        });
      });
    },
    stopAccount: async (ctx: any) => {
      const accountId = ctx.accountId ?? "default";
      const client = clients.get(accountId);
      if (client) {
        client.stop();
        clients.delete(accountId);
      }
      ctx.setStatus({ running: false });
    },
    loginWithQrStart: async () => ({
      message:
        "QR pairing is intentionally out of scope for the runtime plugin. Provide token/wsUrl via config or a separate pairing helper.",
    }),
    loginWithQrWait: async () => ({
      connected: false,
      message:
        "No embedded QR pairing flow is implemented in the public bridge runtime scaffold.",
    }),
  },
};

const plugin = {
  id: "wechat-bridge",
  name: "OpenClaw WeChat Bridge",
  description: "Clean-room WeChat bridge channel for OpenClaw.",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setBridgeRuntime(api.runtime);
    api.registerChannel({ plugin: channelPlugin as any });
    console.log("[wechat-bridge] plugin registered");
  },
};

export default plugin;
