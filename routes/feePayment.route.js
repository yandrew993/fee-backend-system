import express from "express";
import {
  getAllFeePayments,
  getFeePayment,
  createFeePayment,
  recordPayment,
  updateFeePayment,
  deleteFeePayment,
  getPaymentStats,
  exportPaymentPDF,
  exportStatementPDF,
  exportStudentPaymentsPDF,
  exportStudentStatementsPDF,
} from "../controllers/feePayment.controller.js";

const router = express.Router();

router.get("/", getAllFeePayments);
router.get("/stats", getPaymentStats);

// PDF Export routes (must be before :id routes)
router.get("/export/payment/:id", exportPaymentPDF);
router.get("/export/statement/:id", exportStatementPDF);
router.get("/export/student/:studentId/payments", exportStudentPaymentsPDF);
router.get("/export/student/:studentId/statements", exportStudentStatementsPDF);

router.get("/:id", getFeePayment);
router.post("/", createFeePayment);
router.put("/:id", updateFeePayment);
router.put("/:id/pay", recordPayment);
router.delete("/:id", deleteFeePayment);

export default router;
