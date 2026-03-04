const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        index: true,
    },
    sender:{
        type: String,
        required: true,
    },
    message:{
        type: String,
        required: true,
        trim: true,
    },
},
{timestamps: { createdAt: true, updatedAt: false }});    

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
