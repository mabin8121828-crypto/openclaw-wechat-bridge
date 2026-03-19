import type { PairingHelper, WechatBridgeAccountConfig } from "./types.js";

export interface PairingSessionInfo extends WechatBridgeAccountConfig {
  qrUrl?: string;
  expiresAt?: string;
}

/**
 * Clean-room pairing contract.
 *
 * QClaw's local shell appears to own the QR login and device-binding flow.
 * This repository keeps that concern separate from the OpenClaw plugin so the
 * runtime channel can be open-sourced without embedding private shell logic.
 */
export interface PairingFlow {
  createLoginSession(): Promise<PairingSessionInfo>;
  createContactLink(accountId: string): Promise<PairingSessionInfo>;
  getDeviceStatus(accountId: string): Promise<"pending" | "connected" | "offline">;
  disconnectDevice(accountId: string): Promise<void>;
}

export function createNullPairingHelper(): PairingHelper {
  return {
    async getSession() {
      return null;
    },
  };
}
