import express from "express";
import {
  getOverallReport,
  getClassReport,
  getStudentReport,
  getPendingFeesReport,
  getReportStatistics,
} from "../controllers/report.controller.js";

const router = express.Router();

router.get("/overall", getOverallReport);
router.get("/statistics", getReportStatistics);
router.get("/pending-fees", getPendingFeesReport);
router.get("/class/:classId", getClassReport);
router.get("/student/:studentId", getStudentReport);

export default router;
