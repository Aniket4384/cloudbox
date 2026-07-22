const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config()
const connectDB = async () => {
    console.log("called")
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("connected")
  } catch (error) {
    console.error("Database connection failed");
    console.log(error.message)
  }
};

module.exports = connectDB;