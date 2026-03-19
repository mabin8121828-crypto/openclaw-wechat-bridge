import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { setBridgeRuntime } from "./runtime.js";
import type {
  BridgeClient,
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

function createBridgeClient(config: WechatBridgeAccountConfig): BridgeClient {
  if (!config.token || !config.wsUrl) {
    throw new Error("wechat-bridge requires both token and wsUrl");
  }

  // TODO: replace this placeholder with a real transport implementation.
  let state: BridgeClient["getState"] extends () => infer T ? T : never = "disconnected";

  return {
    start() {
      state = "connected";
    },
    stop() {
      state = "disconnected";
    },
    getState() {
      return state;
    },
  };
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
    sendText: async () => ({ ok: true }),
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
      const client = createBridgeClient(config);
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
