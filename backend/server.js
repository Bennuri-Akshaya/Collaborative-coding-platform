//The address of the server in the network:
//URL http://localhost:5000
//IP 127.0.0.1:5000

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const IORedis = require("ioredis");

// Patch ALL Redis connections globally
const OriginalRedis = IORedis;

function PatchedRedis(...args) {
  if (!args.length || args[0] === undefined) {
    console.log("⚠️ Redis called without URL → forcing Upstash");
    return new OriginalRedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: {},
    });
  }
  return new OriginalRedis(...args);
}

// Override ioredis globally
require.cache[require.resolve("ioredis")].exports = PatchedRedis;
const connectDB = require('./config/db');  
const roomRoutes = require('./routes/roomRoutes');  
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const http = require("http");
const { Server } = require("socket.io");
const  { pullImages } = require('./execution/startup');
// const { createBullBoard } = require("@bull-board/api");
// const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
// const { ExpressAdapter } = require("@bull-board/express");
const { queueConnection,executionQueue } = require("./execution/queue.js");
// const { initializeWorker } = require("./execution/worker.js");
const { initializeSockets } = require("./socket/index.js")
const { registerExecutionHandler } = require("./socket/executionHandler.js")
const { QueueEvents } = require("bullmq");
const { setRoomIdle } = require("./execution/roomExecutionState.js");

const runCodeRoute = require("./routes/runCode.js");
const { timeStamp } = require('console');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

connectDB();

// app.use(cors({
//     origin: process.env.CLIENT_URL,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],  
// }));

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/rooms', authMiddleware, roomRoutes);
app.use("/api/execution", require("./routes/executionRoutes.js"));
app.use("/api/test",runCodeRoute)
// //Bull booard
// const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/admin/queues");

// createBullBoard({
//   queues: [new BullMQAdapter(executionQueue)],
//   serverAdapter,
// });
// app.use("/admin/queues", serverAdapter.getRouter());

//Socket.io created
// const io = new Server(server,{
//     cors:{
//         origin: process.env.CLIENT_URL,
//         methods: ["GET", "POST", "PUT", "DELETE"],
//         credentials: true,//Allows cookies to be sent with requests, enabling session management and authentication features.
//         allowedHeaders: ["Content-Type", "Authorization"],  
//     }
// })
//socket.io
const io = new Server(server,{
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const queueEvents = new QueueEvents("code-execution",{
  connection: queueConnection,
});

//Add completed listener
queueEvents.on("completed",async ({ jobId, returnvalue }) => {
  console.log("Job completed:", jobId);

  const job = await executionQueue.getJob(jobId);
  if(!job) return;

  const { roomId, username, language } = job.data;
  const result = returnvalue;

  setRoomIdle(roomId);

  io.to(roomId).emit("execution:result",{
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
    executionTime: result.executionTime,
    language,
    triggeredBy: username,
    timeStamp:Date.now(),
  })
})
//Adding failed listener
queueEvents.on("failed",async ({ jobId, failedReason }) => {
  console.error("Job failed:",jobId,failedReason);

  const job = await executionQueue.getJob(jobId);
  if(!job) return;

  const { roomId, username } = job.data;

  setRoomIdle(roomId);

  io.to(roomId).emit("execution:error",{
    message: failedReason,
    triggeredBy: username,
  });
});

//Initialize sockets
initializeSockets(io);

async function startServer() {
  //await pullImages();                    // ← ADDED — pull Docker images first
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();