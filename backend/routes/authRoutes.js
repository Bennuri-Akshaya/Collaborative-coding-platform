const express = require("express");
const argon2 = require("argon2");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router(); 
const crypto = require("crypto")
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

//Sign up route
router.post("/signup",async(req,res)=>{
    try{
        const{username,email,password} = req.body;
        //Basic validation
        if(!username || !email || !password){
            return res.status(400).json({message: "Please provide all the details required"})
        }

        //Check if user already exists
        const userExists = await User.findOne( {$or:[{ username },{ email }]});
        if(userExists){
            return res.status(400).json({message: "Username or email already exists,Try Signing in"})
        }

        //Hash password
        const hashedPassword = await argon2.hash(password);

        //Create new user
        const user = await User.create({
            username,
            email,
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

//Adding what happens when the send reset link is clicked(The email sender)
router.post("/forgot-password",async(req,res) => {
    const { email } = req.body;

    //find the user
    const user = await User.findOne({ email });
    if(!user) return res.status(404).json({ message: "No user found with this email"});

    //Generating random token and storing it in db and expires in 15 mins
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; //15 mins 
    await user.save();

    //reset link
    const resetLink = `https://codevcollaborative-coding-platform.vercel.app/reset-password/${token}`;

    //Send mail
    await resend.emails.send({
        from:"onboarding@resend.dev",
        to: email,
        subject: "CoDev Reset Password",
        html:`
          <div style="font-family:sans-serif">
            <h2>Reset Your Password</h2>
            <p>This link will expire in 15 minutes.</p>
            <a href="${resetLink}" 
               style="padding:10px 20px;background:#3b82f6;color:white;text-decoration:none;border-radius:5px;">
               Reset Password
            </a>
          </div>
        `,
    })
    res.json({ message: "Reset link sent to your email!"})
});

//Reset password page when user clicks on the reset link that is sent
router.post("/reset-password/:token", async (req,res) =>{
    try{
        const { token } = req.params;
        const { password } = req.body;
        
        //Find user with valid token
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now()},
        });
        if(!user){
            return res.status(400).json({ message: "Invalid or expired token"});
        }

        //Hash the new password
        const hashedPassword = await argon2.hash(password);

        //Update the password in the db
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });
    }catch(err){
        res.status(500).json({ message: "Error resetting password" })
    }
});

module.exports = router;