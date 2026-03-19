import WebSocket from "ws";
import type {
  BridgeClient,
  BridgeClientHooks,
  BridgeEventEnvelope,
  BridgeInboundEnvelope,
  BridgeMessageSendPayload,
  WechatBridgeAccountConfig,
} from "./types.js";

const DEFAULT_RECONNECT_MS = 3_000;

function buildSocketUrl(config: WechatBridgeAccountConfig): string {
  const url = new URL(config.wsUrl!);
  if (config.token && !url.searchParams.has("token")) {
    url.searchParams.set("token", config.token);
  }
  return url.toString();
}

function parseInboundEnvelope(raw: WebSocket.RawData): BridgeInboundEnvelope | null {
  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    const json = JSON.parse(text) as BridgeInboundEnvelope;
    if (!json || typeof json !== "object") {
      return null;
    }
    return json;
  } catch {
    return null;
  }
}

export class BridgeWebSocketClient implements BridgeClient {
  private socket: WebSocket | null = null;
  private state: ReturnType<BridgeClient["getState"]> = "disconnected";
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stopRequested = false;

  constructor(
    private readonly config: WechatBridgeAccountConfig,
    private readonly hooks: BridgeClientHooks = {}
  ) {}

  start(): void {
    this.stopRequested = false;
    if (this.socket || this.state === "connecting" || this.state === "connected") {
      return;
    }
    this.connect();
  }

  stop(): void {
    this.stopRequested = true;
    this.clearReconnectTimer();
    this.state = "disconnected";
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
    this.hooks.onDisconnected?.("stopped");
  }

  getState(): "connected" | "connecting" | "reconnecting" | "disconnected" {
    return this.state;
  }

  async sendText(payload: BridgeMessageSendPayload): Promise<void> {
    if (!this.socket || this.state !== "connected") {
      throw new Error("wechat-bridge socket is not connected");
    }

    const frame: BridgeEventEnvelope = {
      type: "message.send",
      payload,
    };
    await new Promise<void>((resolve, reject) => {
      this.socket!.send(JSON.stringify(frame), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  private connect(): void {
    this.clearReconnectTimer();
    this.state = this.state === "disconnected" ? "connecting" : "reconnecting";

    const socket = new WebSocket(buildSocketUrl(this.config), {
      headers: this.config.token
        ? {
            Authorization: `Bearer ${this.config.token}`,
            "X-Wechat-Bridge-Token": this.config.token,
          }
        : undefined,
    });

    this.socket = socket;

    socket.on("open", () => {
      this.state = "connected";
      this.hooks.onConnected?.();
    });

    socket.on("message", (raw) => {
      const event = parseInboundEnvelope(raw);
      if (!event) {
        this.hooks.onWarning?.("Received non-JSON websocket frame");
        return;
      }
      this.hooks.onEvent?.(event);
    });

    socket.on("error", (error) => {
      this.hooks.onError?.(error);
    });

    socket.on("close", (_code, reasonBuffer) => {
      const reason = reasonBuffer ? reasonBuffer.toString("utf8") : "closed";
      this.socket = null;
      this.state = "disconnected";
      this.hooks.onDisconnected?.(reason);
      if (!this.stopRequested) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopRequested) {
      return;
    }
    this.state = "reconnecting";
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, DEFAULT_RECONNECT_MS);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
