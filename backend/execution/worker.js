//this is where executeCode() from phase 1 gets called .
//The worker listens to the queue and processes jobs one by one respecting the concurrency limit

const { Worker } =  require("bullmq");
const { executeCode } = require("./executor.js");
const { workerConnection } = require("./queue.js");

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
const executionWorker = new Worker("code-execution", processExecution, {
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
    console.log(`[Worker] Job ${job.id} completed - stdout length: ${result.stdout?.length}`);
    //io.to(`room:${job.data.roomId}`).emit("execution:error",{ message: err.message })
});

executionWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job.id} failed —`, err.message);
  // io.to(`room:${job.data.roomId}`).emit("execution:error", { message: err.message })
});

executionWorker.on("error",(err)=>{
    console.error("[Worker] Worker error -",err.message);
});

module.exports = { executionWorker };


