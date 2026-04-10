const moongose = require('mongoose');

const userSchema = new moongose.Schema({
    username:{
        type:String,
        required:true,
        trim:true, // Remove whitespace
        unique:true, // Ensure username is unique
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    resetToken: String,
    resetTokenExpiry: Date,
},{timestamps: true}); // Automatically add createdAt and updatedAt fields)

module.exports = moongose.model("User",userSchema)