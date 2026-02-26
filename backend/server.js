//The address of the server in the network:
//URL http://localhost:5000
//IP 127.0.0.1:5000

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');    

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();
connectDB();

app.get('/',(req,res)=>{
    res.send('API is running...');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});