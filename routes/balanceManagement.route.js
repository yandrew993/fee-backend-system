import express from "express";
import {
  recalculateStatementBalance,
  recalculateStudentBalances,
  recalculateTermBalances,
  recalculateYearBalances,
  recalculateAllActiveTermsBalances,
  startBalanceUpdateSchedule,
  stopBalanceUpdateSchedule,
  getBalanceUpdateScheduleStatus,
} from "../controllers/balanceManagement.controller.js";

const router = express.Router();

// Recalculation endpoints
router.post("/recalculate/statement/:statementId", recalculateStatementBalance);
router.post("/recalculate/student/:studentId", recalculateStudentBalances);
router.post("/recalculate/term/:academicYear/:term", recalculateTermBalances);
router.post("/recalculate/year/:academicYear", recalculateYearBalances);
router.post("/recalculate/all-active-terms", recalculateAllActiveTermsBalances);

// Schedule management endpoints
router.post("/schedule/start", startBalanceUpdateSchedule);
router.post("/schedule/stop", stopBalanceUpdateSchedule);
router.get("/schedule/status", getBalanceUpdateScheduleStatus);

export default router;
