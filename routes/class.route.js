import express from "express";
import {
  getAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassFeeSummary,
} from "../controllers/class.controller.js";

const router = express.Router();

router.get("/", getAllClasses);
router.get("/:id", getClass);
router.get("/:id/fee-summary", getClassFeeSummary);
router.post("/", createClass);
router.patch("/:id", updateClass);
router.delete("/:id", deleteClass);

export default router;
