const bcrypt = require("bcrypt");
const {
  signupValidator,
  loginValidator,
} = require("../validators/authValidator");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const register = async (req, res) => {
  try {
    const { error } = signupValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { error } = loginValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "incorrect password", success: false });
    }
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "success",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name,
        email: email,
      });
    }

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
       httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "success",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "google auth error : " + err.message,
    });
  }
};
module.exports = { register, login, logout, googleAuth };
