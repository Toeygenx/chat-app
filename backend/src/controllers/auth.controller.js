import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/util.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }); //find email in User
    const checkName = await User.findOne({ fullName });
    if (checkName)
      return res.status(400).json({ message: "This Full Name already exists" });

    if (user) return res.status(400).json({ message: "Email already exists" });
    //hash password by using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //tell what it is user for store
    const newUser = new User({
      fullName: fullName,
      email: email,
      password: hashedPassword,
    });

    if (newUser) {
      //generate jwt token here
      // _id from mongodb
      generateToken(newUser._id, res);
      //save this newUser into db
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilPic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //findOne is method in mongoose for find something in collection (this line is collection User) and will return it if found
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password); //compare between password from input , password from database

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    //gen token that will attach to cookie for this user
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilPic: user.profilPic,
    });
  } catch (error) {
    console.error("Error in login controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    //set cookie to expire immediately
    res.cookie("jwt", "", { maxAge: 0 }); //res.cookie: A method provided by Express.js to set cookies on the HTTP response //"jwt": The name of the cookie to be set
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilPic: profilePic } = req.body;
    //we can acces req.user._id bcuz this is protectRoute we declare it before
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }
    //cloudinary is not db its just bucket to store img
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    //we need to update it in db
    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        profilPic: uploadResponse.secure_url, //uploadResponse from cloudinary
      },
      { new: true }
    ).select("-password");

    res.status(200).json(updateUser);
  } catch (error) {
    console.error("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    //response with user if authen is pass
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};