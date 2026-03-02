//The address of the server in the network:
//URL http://localhost:5000
//IP 127.0.0.1:5000

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');  
const roomRoutes = require('./routes/roomRoutes');  
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.get('/',(req,res)=>{
    res.send('API is running...');
})

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,//Allows cookies to be sent with requests, enabling session management and authentication features.
        allowedHeaders: ["Content-Type", "Authorization"],  
    })
)

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/rooms', authMiddleware, roomRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});