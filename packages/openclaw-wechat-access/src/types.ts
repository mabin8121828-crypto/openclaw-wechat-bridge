export type NormalizedChatType = "direct" | "group" | "channel";

export interface WechatBridgeAccountConfig {
  accountId?: string;
  token?: string;
  wsUrl?: string;
}

export interface WechatBridgeRootConfig {
  token?: string;
  wsUrl?: string;
  accounts?: Record<string, WechatBridgeAccountConfig>;
}

export interface PairingHelper {
  getSession(accountId: string): Promise<WechatBridgeAccountConfig | null>;
  disconnect?(accountId: string): Promise<void>;
}

export interface BridgeClient {
  start(): void;
  stop(): void;
  getState(): "connected" | "connecting" | "reconnecting" | "disconnected";
}
