const express = require('express');
const {v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router(); //routing for room creation and management

// Create a new room
router.post("/create",authMiddleware,async(req,res)=>{
    try{
        const { userId } = req.body;

        const newRoom = new Room({
            roomId:uuidv4(),
            createdBy:userId,
            participants:[userId],
        });

        await newRoom.save();

        res.status(201).json({
            message:"Room created successfully",
            roomId:newRoom.roomId,
        });
    }catch(error){
        res.status(500).json({error: error.message || "Failed to create room" });
    }
});

//Join a room
//find room by roomid if not found return error,check if user is already a participant if not add to participants and save room

router.post("/join/:roomId",authMiddleware,async (req,res)=>{
    try{
        const { roomId } =req.params;
        const userId = req.user.id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        const username = user.username;
        const room = await Room.findOne({ roomId });
        if(!room){
            return res.status(404).json({ message: "Room not found" });
        }

        //Check if user already joined
        const alreadyJoined = room.participants.some(
            (participant) => participant.toString() === userId
        );
        if (!alreadyJoined){
            room.participants.push(userId);
            await room.save();
        }
        res.json({
            message: `User ${username} joined the room`,
            roomId: room.roomId,
            participants: room.participants,
        });
    }catch(error){
        res.status(500).json({error: error.message || "Failed to join room" });
    }
});

//Leave a room
router.post("/leave/:roomId",authMiddleware,async(req,res)=>{
    try{
        const {roomId} = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        const username = user.username;

        const room = await Room.findOne({ roomId});
        if(!room){
            return res.status(404).json({ message: "Room not found"});
        }

        //Remove user from participants
        room.participants = room.participants.filter(
            (participant => participant.toString() !== userId)
        );

        //if no users left delete room
        if(room.participants.length === 0){
            await Room.deleteOne({ roomId });
            return res.json({ message: "Room deleted as no participants left"});
        }

        //otherwise save updated room
        await room.save();
        res.json({ message: `User ${username} left the room`});
    }catch(error){
        res.status(500).json({error: error.message || "Failed to leave room" });
    }   
});

module.exports = router;