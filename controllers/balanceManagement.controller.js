/**
 * Balance Management Controller
 * Handles balance recalculation endpoints and monitoring
 */

import {
  updateSingleStatementBalance,
  updateStudentAllBalances,
  updateTermAllBalances,
  updateYearAllBalances,
  updateAllActiveTermsBalances,
  startScheduledBalanceUpdates,
  stopScheduledBalanceUpdates,
  getBalanceUpdateStatus,
} from "../lib/balanceUpdateService.js";

// Recalculate balance for a single fee statement
export const recalculateStatementBalance = async (req, res) => {
  try {
    const { statementId } = req.params;

    if (!statementId || statementId === "undefined") {
      return res.status(400).json({ message: "Statement ID is required" });
    }

    if (!statementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid statement ID format" });
    }

    const updated = await updateSingleStatementBalance(statementId);

    if (!updated) {
      return res.status(404).json({ message: "Statement not found" });
    }

    res.status(200).json({
      message: "Statement balance recalculated successfully",
      statement: updated,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate all balances for a student
export const recalculateStudentBalances = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId || studentId === "undefined") {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const updated = await updateStudentAllBalances(studentId);

    res.status(200).json({
      message: `Recalculated balances for ${updated.length} fee statements`,
      studentId,
      updatedStatements: updated.length,
      statements: updated,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate all balances for a term
export const recalculateTermBalances = async (req, res) => {
  try {
    const { academicYear, term } = req.params;

    if (!academicYear || !term) {
      return res.status(400).json({
        message: "academicYear and term are required",
      });
    }

    const updatedCount = await updateTermAllBalances(academicYear, term);

    res.status(200).json({
      message: `Recalculated balances for ${updatedCount} students`,
      academicYear,
      term,
      updatedCount,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate all balances for an academic year
export const recalculateYearBalances = async (req, res) => {
  try {
    const { academicYear } = req.params;

    if (!academicYear) {
      return res.status(400).json({ message: "academicYear is required" });
    }

    const result = await updateYearAllBalances(academicYear);

    res.status(200).json({
      message: `Recalculation completed for academic year ${academicYear}`,
      academicYear,
      totalUpdated: result.totalUpdated,
      results: result.results,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate all balances for all active terms
export const recalculateAllActiveTermsBalances = async (req, res) => {
  try {
    const result = await updateAllActiveTermsBalances();

    res.status(200).json({
      message: "Recalculation completed for all active terms",
      totalUpdated: result.totalUpdated,
      termsProcessed: result.results.length,
      results: result.results,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start scheduled balance updates
export const startBalanceUpdateSchedule = async (req, res) => {
  try {
    const { intervalMinutes } = req.body;
    const interval = intervalMinutes || 5; // Default to 5 minutes

    if (interval < 1 || interval > 1440) {
      return res.status(400).json({
        message: "Interval must be between 1 and 1440 minutes",
      });
    }

    startScheduledBalanceUpdates(interval);

    res.status(200).json({
      message: `Scheduled balance updates started (interval: ${interval} minutes)`,
      interval,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stop scheduled balance updates
export const stopBalanceUpdateSchedule = async (req, res) => {
  try {
    stopScheduledBalanceUpdates();

    res.status(200).json({
      message: "Scheduled balance updates stopped",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get balance update schedule status
export const getBalanceUpdateScheduleStatus = async (req, res) => {
  try {
    const status = getBalanceUpdateStatus();

    res.status(200).json({
      ...status,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
