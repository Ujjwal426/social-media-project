import express from "express";
import {
  addComment,
  createdPost,
  deleteComment,
  deletePost,
  getPostFollowing,
  likeAndUnlikePost,
  updateCaption,
} from "../controller/Post.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post/upload", isAuthenticated, createdPost);
router.post("/post/:id", isAuthenticated, likeAndUnlikePost);
router.delete("/post/:id", isAuthenticated, deletePost);
router.get("/posts", isAuthenticated, getPostFollowing);
router.post("/updateCap/:id", isAuthenticated, updateCaption);
router.post("/post/comment/:id", isAuthenticated, addComment);
router.delete("/post/comment/delete/:id", isAuthenticated, deleteComment);
export default router;
