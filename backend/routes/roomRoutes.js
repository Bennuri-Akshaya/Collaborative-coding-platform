const express = require('express');
const {v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router(); //routing for room creation and management

// Create a new room
router.post("/create",authMiddleware,async(req,res)=>{
    try{
        const{userId}=req.body;

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
})

module.exports = router;