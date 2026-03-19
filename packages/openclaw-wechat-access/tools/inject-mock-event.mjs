import process from "node:process";

const controlPort = Number(process.env.MOCK_BRIDGE_CONTROL_PORT || 8788);
const text = process.argv.slice(2).join(" ").trim() || "mock inbound hello";

const response = await fetch(`http://127.0.0.1:${controlPort}/inject`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    text,
    from: {
      id: "mock-user-001",
      name: "Mock User",
    },
  }),
});

const body = await response.text();
console.log(body);
