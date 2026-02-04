import express from "express";
import { 
  createPayment, 
  getMonthlyPaymentStats, 
  getPayments, 
  getPaymentStats, 
  mpesaCallback, 
  payment, 
  totalPayments, 
  updatePaymentStatus,
  handleFamilyBankCallback // <-- add this
} from "../controllers/payment.controller.js";// import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/mpesa-callback", mpesaCallback);

router.get("/", getPayments);
router.get("/total", totalPayments);
router.get("/stats", getPaymentStats);
router.get("/monthly-stats", getMonthlyPaymentStats);
// router.get("/status/:checkoutRequestId", checkPaymentStatus); 
router.post("/save", createPayment)
router.post("/", payment );
router.put("/update", updatePaymentStatus);
router.post("/familybank-callback", handleFamilyBankCallback);

export default router;
