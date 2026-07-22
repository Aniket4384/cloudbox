const express = require('express')
const {register,login, logout, googleAuth }= require('../controllers/userAuth')
const authMiddleware = require('../middleware/authMiddleware')

const authRouter = express.Router()


authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout' , authMiddleware,logout)
authRouter.post('/googleAuth' , googleAuth)


module.exports = authRouter