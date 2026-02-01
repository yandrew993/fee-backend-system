import express from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  getSavedPosts,
  savePost,
  profilePosts,
  getNotificationNumber,
  totalUsers,
  deleteSavedPost,
  usersWithPosts,
  getUserStats,
  getLandlordStats,
  createUser,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET routes with specific paths (must come before parameterized routes)
router.get("/count", verifyToken, totalUsers);
router.get("/landlords", verifyToken, usersWithPosts);
router.get("/stats", verifyToken, getUserStats);
router.get("/landlord-stats", verifyToken, getLandlordStats);
router.get("/saved", verifyToken, getSavedPosts);
router.get("/profilePosts", verifyToken, profilePosts);
router.get("/notification", verifyToken, getNotificationNumber);

// POST and general routes
router.post("/", verifyToken, createUser);
router.post("/save", verifyToken, savePost);

// GET all users
router.get("/", verifyToken, getUsers);

// Parameterized routes (must come last)
router.get("/:id", verifyToken, getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
router.delete("/unsave/:postId", verifyToken, deleteSavedPost);

export default router;
