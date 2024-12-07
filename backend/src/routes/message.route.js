import express from "express";
import { protectRoute } from "../middleware/auth.protectRoute.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
//this will get hisoty chat by id, id mean another one
router.get("/:id", protectRoute, getMessages);
//this will send message
router.post("/send/:id", protectRoute, sendMessage);

export default router;
