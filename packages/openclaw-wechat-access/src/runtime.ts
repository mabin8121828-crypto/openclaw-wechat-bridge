import type { PluginRuntime } from "openclaw/plugin-sdk";

let runtime: PluginRuntime | null = null;

export function setBridgeRuntime(next: PluginRuntime): void {
  runtime = next;
}

export function getBridgeRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("wechat-bridge runtime not initialized");
  }
  return runtime;
}
