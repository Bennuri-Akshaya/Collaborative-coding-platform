const moongose = require('mongoose');

const userSchema = new moongose.Schema({
    username:{
        type:String,
        required:true,
        trim:true, // Remove whitespace
        unique:true, // Ensure username is unique
    },
    password:{
        type:String,
        required:true,
    },
},{timestamps: true}); // Automatically add createdAt and updatedAt fields)

module.exports = moongose.model("User",userSchema)