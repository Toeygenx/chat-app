import express from "express";
import {
  login,
  logout,
  signup,
  updateProfile,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
//protectRoute is function that we create for checking user access
router.put("/update-profile", protectRoute, updateProfile);
//use when user refresh our app eg. Profile page
router.get("/check", protectRoute, checkAuth);

export default router;
