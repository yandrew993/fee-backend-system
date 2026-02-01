import express from "express";
import {
  getAllStudentFeeStatements,
  getStudentFeeStatement,
  createStudentFeeStatement,
  updateStudentFeeStatement,
  deleteStudentFeeStatement,
  getStudentFeeSummary,
  bulkCreateFeeStatements,
  exportStatementAsPDF,
} from "../controllers/studentFeeStatement.controller.js";

const router = express.Router();

// Get all student fee statements with filters
router.get("/", getAllStudentFeeStatements);

// Get fee summary for a specific student
router.get("/summary/:studentId", getStudentFeeSummary);

// PDF Export route (must be before :id routes)
router.get("/export/:id", exportStatementAsPDF);

// Get single student fee statement
router.get("/:id", getStudentFeeStatement);

// Create new student fee statement
router.post("/", createStudentFeeStatement);

// Bulk create statements for all students in a class
router.post("/bulk/create", bulkCreateFeeStatements);

// Update student fee statement
router.patch("/:id", updateStudentFeeStatement);

// Delete student fee statement
router.delete("/:id", deleteStudentFeeStatement);

export default router;
