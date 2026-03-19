import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { WebSocketServer } from "ws";

const WS_PORT = Number(process.env.MOCK_BRIDGE_PORT || 8787);
const CONTROL_PORT = Number(process.env.MOCK_BRIDGE_CONTROL_PORT || 8788);
const EXPECTED_TOKEN = process.env.WECHAT_BRIDGE_TOKEN || "";

const wsServer = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

function readToken(req) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;
  return (
    url.searchParams.get("token") ||
    req.headers["x-wechat-bridge-token"] ||
    bearer ||
    ""
  );
}

function buildInboundEvent(payload) {
  return {
    id: randomUUID(),
    type: payload.type || "message.receive",
    timestamp: new Date().toISOString(),
    from: {
      id: payload.from?.id || "mock-user-001",
      name: payload.from?.name || "Mock User",
    },
    payload: {
      text: payload.text || "",
      body: payload.text || "",
      message: payload.text || "",
    },
  };
}

function broadcast(event) {
  const frame = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(frame);
    }
  }
}

function log(...args) {
  console.log("[mock-bridge]", ...args);
}

wsServer.on("connection", (socket, req) => {
  const token = readToken(req);
  if (EXPECTED_TOKEN && token !== EXPECTED_TOKEN) {
    log("reject connection: invalid token");
    socket.close(4001, "invalid token");
    return;
  }

  clients.add(socket);
  log("client connected", { clients: clients.size });

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString("utf8"));
      log("received", msg);
      if (msg?.type === "message.send") {
        socket.send(
          JSON.stringify({
            id: randomUUID(),
            type: "message.ack",
            timestamp: new Date().toISOString(),
            payload: {
              ok: true,
              echoedText: msg?.payload?.text || "",
              to: msg?.payload?.to || "",
            },
          })
        );
      }
    } catch (error) {
      log("non-json frame", String(error));
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    log("client disconnected", { clients: clients.size });
  });
});

const controlServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/inject") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const event = buildInboundEvent(payload);
        broadcast(event);
        log("injected inbound event", event);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, deliveredTo: clients.size, event }));
      } catch (error) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: String(error) }));
      }
    });
    return;
  }

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      ok: true,
      wsPort: WS_PORT,
      controlPort: CONTROL_PORT,
      clients: clients.size,
      hint: "POST /inject with {\"text\":\"hello\"}",
    })
  );
});

controlServer.listen(CONTROL_PORT, () => {
  log(`ws listening on ws://127.0.0.1:${WS_PORT}`);
  log(`control listening on http://127.0.0.1:${CONTROL_PORT}`);
});

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  const line = chunk.trim();
  if (!line) {
    return;
  }
  const event = buildInboundEvent({ text: line });
  broadcast(event);
  log("stdin injected", event);
});
