import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    //find all user that not equal loggedInUserId and don't return password
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in geUsersForSidebar controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        //find message that sender is me and receiver is another
        { senderId: myId, receiverId: userToChatId },
        //Or find message that sender is another and receiver is me
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessage controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//message can be text or img
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      //upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      //this will give url of that image
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    //save to db
    await newMessage.save();

    //todo: realtim func goes here => socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      //boardcast to receiverSocketId
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    //200 = ok, 201 = created
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessages controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};