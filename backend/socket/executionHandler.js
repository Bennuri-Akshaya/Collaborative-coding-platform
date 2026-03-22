const { executionQueue } = require("../execution/queue.js");
const {
    setRoomRunning,
    setRoomIdle,
    isRoomRunning,
} = require("../execution/roomExecutionState.js");
const { checkUserLimit, checkRoomLimit } = require("../middleware/rateLimiter.js");
const { LANGUAGES } = require('../config/languages.js')

function registerExecutionHandler(io,socket){
    socket.on("execution:request", async (data) =>{
        const { roomId, language , code, stdin= "" } = data;
        console.log("[ExecutionHandler] receieved execution:request",data)
        if(!roomId || !language || !code){
            socket.emit("execution:error",{
                message: "Missing required fields: roomId, language, code"
            });
            return;
        }

        //Validate language is imp as it prevents someone sending "language:" rm -rf /" type attacks"
        if(!LANGUAGES[language]){
            socket.emit("execution:error",{
                message: `Unsupported language: ${language}`,
            });
            return;
        }

        if(typeof code!== "string" || code.trim().length === 0){
            socket.emit("execution:error",{
                message: "Code cannot be empty",
            });
            return;
        }
        if(code.length > 50000){
            socket.emit("execution:error",{
                message: "Code exceeds maximum allowed size (50KB)",
            });
            return;
        }
        if(stdin.length > 10000){
            socket.emit("execution:error",{
                message: "Stdin exceeds maximum allowed size (10KB)",
            });
            return;
        }
        //Per room lock only one execution allowed per room at a time 
        if(isRoomRunning(roomId)){
            socket.emit("execution:rejected",{
                message: "An execution is already in progress for this room",
            });
            return;
        }

        //Rate limiting 
        try{
            await checkUserLimit(socket.userId);
        }catch(rejRes){
            const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000/60); //in minutes
            socket.emit("execution:rejected",{
                message: `You have exceeded the execution limit. Try again in ${retryAfter} minutes ${retryAfter > 1 ? "s":""}.`,
                retryAfter: rejRes.msBeforeNext,
            });
            return;
        }

        try{
            await checkRoomLimit(roomId);
       }catch(rejRes){
        const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000 / 60);
        socket.emit("execution:rejected",{
            message: `This room has exceeded the execution limit. Try againin ${retryAfter} minutes ${retryAfter > 1 ? "s":""}.`,
            retryAfter: rejRes.msBeforeNext,
        });
        return;
       }

        try{
            //Add job to queue
            const job = await executionQueue.add("run",{
                roomId,
                language,
                code,
                stdin,
                userId: socket.userId, 
                username: socket.username,
            });

            //Mark room as running immediately after job is added
            setRoomRunning(roomId,job.id);

            //Notify all users in the room that exxecutions started
            //This what triggers the spinner on everyone's screen
            io.to(roomId).emit("execution:queued",{
                jobId: job.id,
                language,
                triggeredBy: socket.username,
                timestamp:Date.now(),
            });
        }catch(err){
            console.error("[ExecutionHandler] Failed to queue job:",err.message);
            //If queueing fails,make sure room is not stuck in running state
            setRoomIdle(roomId);
            socket.emit("execution:error",{
                message: "Failed to queue execution.Please try again.",
            })
        }
    });
}

module.exports = { registerExecutionHandler };