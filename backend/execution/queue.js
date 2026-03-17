//Export the queue instanec and the redis connection so both the producer(adding jobs) and worker(processing jobs) share the same connection

const { Queue } = require("bullmq");
const { Redis } = require("ioredis");
const dotenv = require('dotenv');

//Shared redis connection config
//BullMq requires maxRetriesPerRequest:null for blocking operations
const redisConfig = {
    host:"127.0.0.1",
    port: 6379,
    maxRetriesPerRequest : null, //required by BullMQ
};

//Seperate connection instances BullMQ requires seperate connections for Queue and Worker
const queueConnection = new Redis(redisConfig);
const workerConnection = new Redis(redisConfig);

//The queue-jobs are added
const executionQueue = new Queue("code-execution",{
    connection: queueConnection,
    defaultJobOptions:{
        attempts:1,  //no retries - code execution is -not idempotent(repetition changes the outcome)
        removeOnComplete:50, //keep last 50 completed jobs in Redis for Bull board
        removeOnFail: 50, //Keep last 50 failed jobs
    },
});

module.exports = { executionQueue, workerConnection, redisConfig};