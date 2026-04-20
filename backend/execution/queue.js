// 

const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const dotenv = require('dotenv');
dotenv.config();

console.log("REDIS_URL:", process.env.REDIS_URL);
// Use Upstash Redis URL
const queueConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: {}
});

const workerConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: {}
});

const executionQueue = new Queue("code-execution", {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 50,
        removeOnFail: 50,
    },
});

module.exports = { executionQueue, workerConnection };