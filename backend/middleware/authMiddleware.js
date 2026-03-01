const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try{
        let token;
        //Check authorization header
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
            token = req.headers.authorization.split(" ")[1];
        }
        //if no token
        if(!token){
            return res.status(401).json({message: "Unauthorized access, no token provided"})
        }
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    }catch(error){
        res.status(401).json({message: "Unauthorized access"})
    }
};
module.exports = authMiddleware;