const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { startTerminal, handleInput, stopTerminal } = require("./execution/terminalManager"); // Adjust path if needed

const app = express();
const server = http.createServer(app);

// Configure CORS to allow your Vercel frontend
const io = new Server(server, {
  cors: {
    origin: "*", // For testing, or put your Vercel URL here: "https://your-app.vercel.app"
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`[Interactive Server] Client connected: ${socket.id}`);

  // We need to handle the 'join-room' logic here briefly so the terminalManager 
  // can use socket.emit to send data back to the specific room.
  socket.on("join-room", (data) => {
    socket.join(data.roomId);
    console.log(`[Interactive Server] Joined room: ${data.roomId}`);
  });

  // Register the terminal handlers from your existing manager
  socket.on("terminal:start", (data) => {
    // We pass 'io' so we can broadcast to the room, and 'socket' for direct replies
    startTerminal(io, socket, data.roomId, data.language, data.code);
  });

  socket.on("terminal:input", (data) => {
    handleInput(data.roomId, data.data);
  });

  socket.on("terminal:stop", (data) => {
    stopTerminal(data.roomId);
  });

  socket.on("disconnect", () => {
    console.log(`[Interactive Server] Client disconnected: ${socket.id}`);
    // Optional: Cleanup logic if needed
  });
});

const PORT = 5001; // This must match the port you used in 'cloudflared tunnel --url http://localhost:5001'
server.listen(PORT, () => {
  console.log(` Interactive Server running locally on port ${PORT}`);
});