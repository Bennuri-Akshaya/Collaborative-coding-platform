// // creating a small compatible server ourselves

// import http from "http";
// import { WebSocketServer } from "ws";
// import * as Y from "yjs";
// import { WebsocketProvider } from "y-websocket";

// const port = 1234;
// const docs = new Map();

// const server = http.createServer();
// const wss = new WebSocketServer({ server });

// wss.on("connection", (ws, req) => {
//   const roomName = req.url.slice(1) || "default";

//   if (!docs.has(roomName)) {
//     docs.set(roomName, new Y.Doc());
//   }

//   const doc = docs.get(roomName);

//   const provider = new WebsocketProvider(
//     `ws://localhost:${port}`,
//     roomName,
//     doc
//   );

//   ws.on("close", () => {
//     provider.destroy();
//   });
// });

// server.listen(port, () => {
//   console.log(`Yjs WebSocket server running on ws://localhost:${port}`);
// });

// vpkkk

// const http = require("http");
// const WebSocket = require("ws");
// const Y = require("yjs");
// // const { setupWSConnection } = require("y-websocket/bin/utils.cjs");

// const port = 1234;

// const server = http.createServer();
// const wss = new WebSocket.Server({ server });

// wss.on("connection", (conn, req) => {
//   setupWSConnection(conn, req);
// });

// server.listen(port, () => {
//   console.log(`Yjs websocket server running at ws://localhost:${port}`);
// });