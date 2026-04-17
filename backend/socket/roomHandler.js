const jwt = require("jsonwebtoken");
const Room = require("../models/Room");           
const ChatMessage = require("../models/ChatMessage");
const { stopTerminal } = require("../execution/terminalManager.js")

function registerRoomHandler(io, socket, rooms) {
  socket.on("join-room", async ({ roomId, token }) => {
    try {
      console.log("Received token in socket:", token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.username;
      const userId = decoded.id;

      // Store on socket for use in executionHandler
      socket.username = username;
      socket.userId = userId;

      const room = await Room.findOne({ roomId });
      if (!room) return;

      socket.join(roomId);
      socket.roomId = roomId;

      const systemMessage = new ChatMessage({
        roomId,
        sender: "System",
        message: `${username} has joined the room.`,
      });
      const savedSystemMessage = await systemMessage.save();

      const messages = await ChatMessage.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(50);
      socket.emit("chat:history", messages);

      socket.to(roomId).emit("chat:receive", savedSystemMessage);

      if (!rooms[roomId]) rooms[roomId] = [];

      const isHost = room.createdBy.toString() === userId;
      rooms[roomId].push({
        socketId: socket.id,
        username,
        role: isHost ? "host" : "participant",
      });

      console.log(`${username} joined room: ${roomId}`);
      io.to(roomId).emit("participants-joined", rooms[roomId]);

    } catch (error) {
      console.error("Invalid token in socket:", error);
      socket.emit("auth:error", {
    message: "Session expired. Please login again.",
  });

  socket.disconnect(); // 🔥 THIS IS THE FIX
  return;
    }
  });

  socket.on("disconnect", async () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const leavingUser = rooms[roomId].find(
        (p) => p.socketId === socket.id
      );
      rooms[roomId] = rooms[roomId].filter(
        (p) => p.socketId !== socket.id
      );

      if(rooms[roomId].length === 0){
        console.log(`Stopping terminal for empty rooms: ${roomId}`)
        stopTerminal(roomId);
      }

      if (leavingUser) {
        io.to(roomId).emit("chat:receive", {
          sender: "System",
          message: `${leavingUser.username} has left the room.`,
          createdAt: new Date(),
        });
      }

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
        await ChatMessage.deleteMany({ roomId });
        await Room.deleteOne({ roomId });
        console.log(`Room ${roomId} and its chat are deleted`);
      } else {
        io.to(roomId).emit("participants-joined", rooms[roomId]);
      }
    }
    console.log("A user disconnected: " + socket.id);
  });

  socket.on("leave-room", () => {
    socket.disconnect();
  });
}

module.exports = { registerRoomHandler };