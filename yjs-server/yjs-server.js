const http = require("http");
const WebSocket = require("ws");
const setupWSConnection = require("y-websocket").setupWSConnection;

const port = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Yjs server running");
});

const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req);
});

server.listen(port, () => {
  console.log("Yjs server running on port", port);
});