const express = require("express");
const router = express.Router();
const { Queue,QueueEvents } = require("bullmq");
const IORedis = require("ioredis");
require("dotenv").config();

const connection = new IORedis(process.env.REDIS_URL,{
  maxRetriesPerRequest: null,
  tls: {}
});

const codeQueue = new Queue("code-execution", { connection });
const codeQueueEvents = new QueueEvents("code-execution",{ connection });

router.post("/run-code", async (req, res) => {
  try {
    const { code, language, stdin = "" } = req.body;

    const startTime = Date.now();

    // Add job to queue
    const job = await codeQueue.add("execute", {
      code,
      language,
      stdin,
    });

    // Wait for result
    const result = await job.waitUntilFinished(codeQueueEvents);

    const totalTime = Date.now() - startTime;

    res.json({
      output: result.stdout,
      error: result.stderr,
      status: result.status,
      executionTime: result.executionTime, // Docker time
      totalTime, // End-to-end time
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;