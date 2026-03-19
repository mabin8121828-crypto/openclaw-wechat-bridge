import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";
import WebSocket from "ws";

const root = process.cwd();
const port = 8797;
const controlPort = 8798;
const token = "smoke-token";

function log(...args) {
  console.log("[smoke-test]", ...args);
}

function startServer() {
  const child = spawn(
    process.execPath,
    ["./packages/openclaw-wechat-access/tools/mock-bridge-server.mjs"],
    {
      cwd: root,
      env: {
        ...process.env,
        WECHAT_BRIDGE_TOKEN: token,
        MOCK_BRIDGE_PORT: String(port),
        MOCK_BRIDGE_CONTROL_PORT: String(controlPort),
      },
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
  });
  return child;
}

async function waitForControlReady() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${controlPort}/`);
      if (res.ok) {
        return;
      }
    } catch {}
    await delay(250);
  }
  throw new Error("mock bridge control endpoint did not become ready");
}

async function main() {
  const server = startServer();
  let ackSeen = false;
  let inboundSeen = false;
  try {
    await waitForControlReady();
    log("mock bridge control is ready");

    const socket = new WebSocket(`ws://127.0.0.1:${port}?token=${encodeURIComponent(token)}`);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("websocket connect timeout")), 10_000);
      socket.on("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString("utf8"));
      if (message.type === "message.ack") {
        ackSeen = true;
      }
      if (message.type === "message.receive") {
        inboundSeen = true;
      }
    });

    socket.send(
      JSON.stringify({
        type: "message.send",
        payload: {
          to: "mock-user-001",
          text: "smoke outbound",
        },
      })
    );

    await delay(500);

    const injectResponse = await fetch(`http://127.0.0.1:${controlPort}/inject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "smoke inbound",
        from: {
          id: "mock-user-001",
          name: "Mock User",
        },
      }),
    });

    if (!injectResponse.ok) {
      throw new Error(`inject request failed with ${injectResponse.status}`);
    }

    await delay(750);

    if (!ackSeen) {
      throw new Error("did not observe message.ack from mock bridge");
    }
    if (!inboundSeen) {
      throw new Error("did not observe injected inbound message.receive frame");
    }

    log("smoke test passed");
    socket.close();
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error("[smoke-test] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
