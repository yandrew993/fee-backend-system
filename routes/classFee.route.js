import express from "express";
import {
  getAllClassFees,
  getClassFee,
  createClassFee,
  updateClassFee,
  deleteClassFee,
} from "../controllers/classFee.controller.js";

const router = express.Router();

router.get("/", getAllClassFees);
router.get("/:id", getClassFee);
router.post("/", createClassFee);
router.put("/:id", updateClassFee);
router.delete("/:id", deleteClassFee);

export default router;
