const express = require('express')
const server = express()

const connectDB = require('./config/db')
const authRouter = require('./routes/authRoutes')
const cookieParser = require("cookie-parser")
const User = require('./models/userModel')
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware')
const router = require('./routes/fileRoutes')
const frouter = require('./routes/folderRoutes')


server.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));


server.use(express.json())
server.use(cookieParser())



server.use('/auth',authRouter)
server.use('/file',router)

server.use('/folder',frouter)

server.get('/me',authMiddleware, async(req,res)=>{
    const user =  await User.findById(req.user.id)
    res.status(200).json({user})
})









connectDB()
server.listen(3000,()=>{
    console.log("listening at 3000")
})

