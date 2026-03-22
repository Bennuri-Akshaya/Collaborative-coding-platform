const { registerRoomHandler } = require("./roomHandler.js");
const { registerChatHandler } = require("./chatHandler.js");
const { registerExecutionHandler } = require("./executionHandler.js");

const rooms = {};

function initializeSockets(io){
    io.on("connection",(socket)=>{
        console.log("A user connected: "+socket.id);

        registerRoomHandler(io,socket,rooms);
        registerChatHandler(io,socket);
        registerExecutionHandler(io,socket);        
    });
}

module.exports = { initializeSockets };