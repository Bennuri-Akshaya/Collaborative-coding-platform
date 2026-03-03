//The address of the server in the network:
//URL http://localhost:5000
//IP 127.0.0.1:5000

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');  
const roomRoutes = require('./routes/roomRoutes');  
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Room = require('./models/Room');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],  
}));

const io = new Server(server,{
    cors:{
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,//Allows cookies to be sent with requests, enabling session management and authentication features.
        allowedHeaders: ["Content-Type", "Authorization"],  
    }
})

const rooms = {}; //In-memory store for rooms and their participants, where the key is the roomId and the value is an array of participant usernames and their socket ids.

io.on("connection",(socket)=>{
    console.log("A user connected: " + socket.id);
    socket.on("join-room",async ({ roomId , token })=>{
        try{
            console.log("Received token in socket:", token);
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            const username = decoded.username;
            const userId = decoded.id;

            const room = await Room.findOne({ roomId});

            if(!room) return;
            
            socket.join(roomId);
            socket.roomId = roomId; //Store the roomId in the socket object for later use, such as when the user disconnects.

            if(!rooms[roomId]){
                rooms[roomId] = [];
            }

            const isHost = room.createdBy.toString() === userId;

            rooms[roomId].push({
                socketId: socket.id,
                username:username,
                role: isHost ? "host" : "participant",
            });

            console.log(`${username} joined room: ${roomId}`);

            //send event to everyone in that room
            io.to(roomId).emit("participants-joined", rooms[roomId]);
        }catch(error){
            console.error("Invalid token in socket:", error);
        }
    });
    socket.on("disconnect",()=>{
        const roomId = socket.roomId;

        if(roomId && rooms[roomId]){
            //Remove this socket from the room's participant list
            rooms[roomId] = rooms[roomId].filter(
                (participant) => participant.socketId !== socket.id
            );

            //if room becomes empty, delete it from the rooms object
            if(rooms[roomId].length === 0){
                delete rooms[roomId];
            }else{
                io.to(roomId).emit("participants-joined", rooms[roomId]);
            }
         }
            console.log("A user disconnected: " + socket.id);
        });
    socket.on("leave-room",() =>{
        socket.disconnect();
    })

});

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/rooms', authMiddleware, roomRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});