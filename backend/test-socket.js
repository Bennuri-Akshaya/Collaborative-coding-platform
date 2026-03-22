//testing the socket connections 
const { io } = require("socket.io-client");

const socket = io("http://localhost:5000",{
    auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJlZTI2MWFhMWM2MDY5NjBjMWQ1MiIsInVzZXJuYW1lIjoiQWtzaCIsImlhdCI6MTc3NDAwMjM5NywiZXhwIjoxNzc0MDg4Nzk3fQ.2VIPOReziiKmuC8NEQXk4Yig3TlbMK333egwbGhqjHQ"}
});

socket.on("connect",() =>{
    console.log("Connected:",socket.id);

    //joining real room that exists in db
    socket.emit("join-room",{
        roomId:"d42d2da6-ef66-4d67-8734-fddb50fc7bfb",
        token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YTJlZTI2MWFhMWM2MDY5NjBjMWQ1MiIsInVzZXJuYW1lIjoiQWtzaCIsImlhdCI6MTc3NDAwMjc2NSwiZXhwIjoxNzc0MDg5MTY1fQ.I6dLygF6tbsiTiosWnaG4snnW7hlpFX4JPLDRN52f30"
    });
});

socket.on("join-room",()=>{
    console.log("Joined room - sending execution request");

    socket.emit("execution:request",{
        roomId:"d42d2da6-ef66-4d67-8734-fddb50fc7bfb",
        language: "python",
        code:"print('hello works')",
        stdin: "",  
    });
});

socket.on("execution:queued",(data)=>{
    console.log("Queued:",data);
});

socket.on("execution:result",(data)=>{
    console.log("Result:",data);
    process.exit(0);
});

socket.on("execution:rejected",(data)=>{
    console.log("Rejected:",data);
});

socket.on("execution:error",(data)=>{
    console.log("Error:",data);
});

