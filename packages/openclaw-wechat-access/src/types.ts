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

export interface BridgeMessageSendPayload {
  to: string;
  text: string;
  accountId?: string | null;
  replyToId?: string | null;
  threadId?: string | number | null;
  mediaUrl?: string;
}

export interface BridgeEventEnvelope<TPayload = unknown> {
  type: string;
  payload?: TPayload;
}

export interface BridgeInboundEnvelope<TPayload = unknown>
  extends BridgeEventEnvelope<TPayload> {
  id?: string;
  timestamp?: string;
  from?: {
    id?: string;
    name?: string;
  };
}

export interface BridgeClientHooks {
  onConnected?: () => void;
  onDisconnected?: (reason?: string) => void;
  onEvent?: (event: BridgeInboundEnvelope) => void;
  onError?: (error: Error) => void;
  onWarning?: (message: string) => void;
}

export interface BridgeClient {
  start(): void;
  stop(): void;
  getState(): "connected" | "connecting" | "reconnecting" | "disconnected";
  sendText(payload: BridgeMessageSendPayload): Promise<void>;
}
