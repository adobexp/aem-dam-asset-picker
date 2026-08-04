const Server = require("./server");

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";
// Local Dev-Shell defaults to mock APIs so Mock Pages (AssetBrowser, etc.) render.
// Override with API=local for a running AEM, or API= (empty) only for production clientlib builds.
const API = process.env.API === undefined ? "mock" : process.env.API;

const server = new Server({ port: PORT, host: HOST, api: API });
server.start().catch((error) => {
  console.error("Failed to start design-system framework server:", error);
  process.exit(1);
});
