//execution related routes

const express = require("express");
const router = express.Router();
const { executionQueue } = require("../execution/queue.js");
const { LANGUAGE_OPTIONS } = require("../config/languages.js");

//Languages endpoint - frontend calls this to populate the dropdown
router.get("/languages",(req,res)=>{
    res.json(LANGUAGE_OPTIONS);
});

//Test route
router.post("/test-queue",async(req,res)=>{
    const { language, code, stdin } = req.body;
    const job = await executionQueue.add("run",{
        language,
        code,
        stdin:stdin || "",
        roomId: "test-room",
        userId: "test-user",
    });
    res.json({ jobId: job.id,message:"Job added to queue"});

})

module.exports = router;