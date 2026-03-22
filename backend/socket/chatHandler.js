const ChatMessage = require("../models/ChatMessage"); 

function registerChatHandler(io, socket) {
  socket.on("chat:send", async ({ roomId, message, sender }) => {
    try {
      const chat = new ChatMessage({ roomId, sender, message });
      const savedMessage = await chat.save();
      io.to(roomId).emit("chat:receive", savedMessage);
    } catch (error) {
      console.error("Chat message error:", error);
    }
  });

  socket.on("typing:start", ({ roomId, username }) => {
    socket.to(roomId).emit("typing:start", username);
  });

  socket.on("typing:stop", ({ roomId, username }) => {
    socket.to(roomId).emit("typing:stop", username);
  });

  socket.on("chat:request-history", async ({ roomId }) => {
    try {
      const messages = await ChatMessage.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(50);
      socket.emit("chat:history", messages);
    } catch (error) {
      console.error("Chat history error:", error);
    }
  });
}

module.exports = { registerChatHandler };