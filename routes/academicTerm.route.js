import express from "express";
import {
  getAllTerms,
  getTerm,
  getTermByYearAndTerm,
  createTerm,
  updateTerm,
  deleteTerm,
  getActiveTerm,
  getActiveTermsByYear,
  recalculateTermBalances,
  recalculateYearBalances,
  recalculateAllActiveTermsBalances,
} from "../controllers/academicTerm.controller.js";

const router = express.Router();

router.get("/", getAllTerms);
router.get("/active", getActiveTerm);
router.get("/active/:academicYear", getActiveTermsByYear);
router.get("/search/:academicYear/:term", getTermByYearAndTerm);
router.get("/:id", getTerm);
router.post("/", createTerm);
router.patch("/:id", updateTerm);
router.delete("/:id", deleteTerm);

// Balance recalculation endpoints
router.post("/balances/recalculate/active-terms", recalculateAllActiveTermsBalances);
router.post("/balances/recalculate/:academicYear", recalculateYearBalances);
router.post("/balances/recalculate/:academicYear/:term", recalculateTermBalances);

export default router;
