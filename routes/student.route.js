import express from "express";
import {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFeeSummary,
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/", getAllStudents);
router.post("/", createStudent);
router.get("/search/:id", getStudent);
router.get("/:id/fee-summary", getStudentFeeSummary);
router.patch("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.get("/:id", getStudent);

export default router;
