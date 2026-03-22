//Tracks roomId to jobId for current running execcutions
//Simple map which lives in memory
//If server restarts all rooms reset to idle

const roomExecutionState = new Map();

function setRoomRunning(roomId, jobId){
    roomExecutionState.set(roomId, jobId);
}

function setRoomIdle(roomId){
    roomExecutionState.delete(roomId);
}

function isRoomRunning(roomId){
    return roomExecutionState.has(roomId);
}

function getRunningJobId(roomId){
    return roomExecutionState.get(roomId);
}

module.exports = {
    setRoomRunning,
    setRoomIdle,
    isRoomRunning,
    getRunningJobId,
}