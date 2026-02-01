import express from "express";
import {
  getAllReceipts,
  getReceipt,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  getReceiptData,
} from "../controllers/receipt.controller.js";

const router = express.Router();

router.get("/", getAllReceipts);
router.get("/:id", getReceipt);
router.get("/:id/data", getReceiptData);
router.post("/", createReceipt);
router.patch("/:id", updateReceipt);
router.delete("/:id", deleteReceipt);

export default router;
