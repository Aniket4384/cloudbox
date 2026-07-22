const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const dotenv = require("dotenv")
dotenv.config()

const authMiddleware = async(req,res,next)=>{
   
    try {
        const token = req.cookies.token;
       
        if(!token){
            return res.status(401).json({
                message: "token not found"
            })
        }
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        const user = await User.findById(payload.id)
       
        if(!user){
            return res.status(401).json({
                message: "user not found"
            })
        }

        req.user = user;
       
        next();
    } catch (error) {
        res.status(401).json({
            message: "middleware error invalid token"
        })
    }

    
}

module.exports = authMiddleware