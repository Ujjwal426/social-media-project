import express from "express";
import { deleteMyProfile } from "../controller/Post.js";
import {
  followUser,
  forgotPassword,
  getAllUsers,
  loginUser,
  myProfile,
  registerUser,
  resetPassword,
  updateUserProfile,
} from "../controller/User.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/follow/:id", isAuthenticated, followUser);
router.post("/update", isAuthenticated, updateUserProfile);
router.delete("/delete/me", isAuthenticated, deleteMyProfile);
router.get("/me", isAuthenticated, myProfile);
router.get("/users", isAuthenticated, getAllUsers);
router.post("/forgot/password", forgotPassword);
router.post("/password/reset/:token");
export default router;
