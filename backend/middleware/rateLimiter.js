//Limiting the number of times a user can click the run endpoint
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { Redis } = require("ioredis");

//Separate Redis connection for rate limiting
const redisClient = new Redis({
    host: "127.0.0.1",
    port: 6379,
    enableOfflineQueue: false //fail fast of redis is down
});

//Per user rate limiter
//Keyed by userId max 20 executions per hour user
const userExecutionLimiter = new RateLimiterRedis({
    storeClient:redisClient,
    keyPrefix: "rl:execution:user",
    points: 20, //20 executions
    duration: 60 * 60, //per hour in seconds
});

//Per room rate limiter
//Keyed by roomId - max 30 executions per hour per room
const roomExecutionLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "rl:execution:room",
    points: 30,  //30 executions
    duration: 60 * 60, //per hour
});

//Consume one point - returns remaining points info
//Throws RateLimiterRees if limit exceeds
async function checkUserLimit(userId){
    return await userExecutionLimiter.consume(userId);
}

async function checkRoomLimit(roomId){
    return await roomExecutionLimiter.consume(roomId);
}

module.exports = {checkUserLimit , checkRoomLimit };