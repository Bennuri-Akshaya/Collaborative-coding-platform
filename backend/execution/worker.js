//this is where executeCode() from phase 1 gets called .
//The worker listens to the queue and processes jobs one by one respecting the concurrency limit

const { Worker } =  require("bullmq");
const { executeCode } = require("./executor.js");
const { workerConnection } = require("./queue.js");
const { setRoomIdle } = require("./roomExecutionState.js")

let executionWorker = null;

console.log("Starting worker...");
require("dotenv").config();

console.log("Initializing worker...");
function initializeWorker(io){
//Job processor - this function is called for every job in the queue
//job.data contains everything the Socket.IO handler put in when adding the job
async function processExecution(job){
    const { language, code, stdin = "" } = job.data;
    console.log(`[Worker] Processing job ${job.id} - language: ${language}`);
    const result = await executeCode(language, code, stdin);

    //Whatever returns here becomes job.returnvalue
    //during socket connection it reads this in worker.on("completed") and emits it via Socket IO
    return result;
}

//Creating the worker concurrency:5 means max 5 docker containers running simultaneously
executionWorker = new Worker("code-execution", processExecution, {
    connection: workerConnection,
    concurrency: 5,
});

//Event listeners
//these are where socket io emission will hook
//for now just log - during socket connection these will be replaced

executionWorker.on("active",(job) => {
    console.log(`[Worker] Job ${job.id} started`);
});

executionWorker.on("completed",(job,result)=>{
    const { roomId, username} = job.data;

    //Mark room as idle so next execution can be triggered
    setRoomIdle(roomId);

    //Broadcasting result to all the users in the room
    // io.to(roomId).emit("execution:result",{
    //     stdout: result.stdout,
    //     stderr: result.stderr,
    //     status: result.status,
    //     executionTime: result.executionTime,
    //     language: job.data.language,
    //     triggeredBy:username,
    //     timestamp: Date.now(),
    // });
});

executionWorker.on("failed", (job, err) => {
    const { roomId, username } = job.data;

    //Mark room as idle even on failure
    setRoomIdle(roomId);

    // io.to(roomId).emit("execution:error",{
    //     message:"Execution failed unexpectedly.Please try again.",
    //     triggeredBy: username,
    // });
    console.error(`[Worker] Job ${job.id} failed -`,err.message);
});

executionWorker.on("error",(err)=>{
    console.error("[Worker] Worker error -",err.message);
});
console.log("[Worker] Worker initialized and listening...");
return executionWorker;
}

if (require.main === module) {
  console.log("Running worker standalone...");

  // Dummy io object (since no Socket.IO in local worker)
  const dummyIO = {
    to: () => ({
      emit: (event, data) => {
        console.log(`[Worker Emit] ${event}`, data);
      }
    })
  };

  initializeWorker(dummyIO);
}

module.exports = { initializeWorker };


