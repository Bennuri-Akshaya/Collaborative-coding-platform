const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        unique: true,
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    participants:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        }],
    codeId:{
        type:String,
    },
},
{timestamps: true});

module.exports = mongoose.model("Room", roomSchema);