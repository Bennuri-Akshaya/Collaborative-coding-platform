const express = require("express");
const argon2 = require("argon2");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();    

//Sign up route
router.post("/signup",async(req,res)=>{
    try{
        const{username,password} = req.body;
        //Basic validation
        if(!username || !password){
            return res.status(400).json({message: "Please provide username and password"})
        }

        //Check if user already exists
        const userExists = await User.findOne({username});
        if(userExists){
            return res.status(400).json({message: "Username already exists,Try Signing in"})
        }

        //Hash password
        const hashedPassword = await argon2.hash(password,10);

        //Create new user
        const user = await User.create({
            username,
            password:hashedPassword,
        });

        //generate token
        const token = jwt.sign(
            {id:user._id,username:user.username},
            process.env.JWT_SECRET,
            {expiresIn:"1d"},
            
        );
        res.status(201).json({
            message: "User created successfully",
            token,
            userId: user._id,
            username: user.username,
        })
    }catch(error){
        res.status(500).json({error: error.message || "Failed to create user"   
        })
    }
})

//Sign in route
router.post("/signin",async (req,res) => {
    try{
        const{username,password} = req.body;
        //Check if user exists
        const user = await User.findOne({username});
        if(!user){
            return res.status(400).json({message: "Invalid Credentials"})
        }
        //Verify password
        const isMatch = await argon2.verify(user.password,password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid Credentials"})
        }

        //generate token
        const token = jwt.sign(
            {id:user._id,username:user.username},
            process.env.JWT_SECRET,
            {expiresIn:"1d"},   
        );
        res.status(200).json({
            message: "Sign in successful",
            token,
            userId: user._id,
            username: user.username,
        })
    }catch(error){
        res.status(500).json({ error: error.message})
    }

});

module.exports = router;