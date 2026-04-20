//execution related routes

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { executionQueue } = require("../execution/queue.js");
const { LANGUAGE_OPTIONS } = require("../config/languages.js");

//HTTP rate limiter for REST endpoints
//Max 60 requests per minute per IP
const httpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {error: "Too many requests. Please slow down."},
});

//Languages endpoint - frontend calls this to populate the dropdown
router.get("/languages",httpLimiter,(req,res)=>{
    res.json(LANGUAGE_OPTIONS);
});


//Test route
// router.post("/test-queue",async(req,res)=>{
//     const { language, code, stdin } = req.body;
//     const job = await executionQueue.add("run",{
//         language,
//         code,
//         stdin:stdin || "",
//         roomId: "test-room",
//         userId: "test-user",
//     });
//     res.json({ jobId: job.id,message:"Job added to queue"});
// })

module.exports = router;