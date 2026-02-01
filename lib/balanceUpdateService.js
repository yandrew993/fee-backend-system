/**
 * Balance Update Service
 * Handles automatic and scheduled updates of student balances
 * Ensures real-time accuracy of fee statements
 */

import prisma from "./prisma.js";

// Log helper with timestamp
const log = (message, level = "info") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [BALANCE-SERVICE] [${level.toUpperCase()}] ${message}`);
};

/**
 * Update balance for a single fee statement
 * Calculates amountPaid and balanceAmount based on completed payments
 */
export const updateSingleStatementBalance = async (statementId) => {
  try {
    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id: statementId },
      include: {
        student: true,
      },
    });

    if (!statement) {
      log(`Statement ${statementId} not found`, "warn");
      return null;
    }

    // Calculate total paid for this statement
    const totalPaid = await prisma.feePayment.aggregate({
      where: {
        studentFeeStatementId: statementId,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const amountPaid = totalPaid._sum.amount || 0;
    const newBalanceAmount = Math.max(0, statement.totalPayable - amountPaid);

    // Update the statement
    const updated = await prisma.studentFeeStatement.update({
      where: { id: statementId },
      data: {
        amountPaid,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount === 0 ? "completed" : "pending",
      },
    });

    log(`Updated balance for student ${statement.student.fullName} (${statement.academicYear} - ${statement.term}): balance = ${newBalanceAmount}`);
    return updated;
  } catch (error) {
    log(`Error updating statement ${statementId}: ${error.message}`, "error");
    throw error;
  }
};

/**
 * Update all balances for a specific student
 */
export const updateStudentAllBalances = async (studentId) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        feeStatements: true,
      },
    });

    if (!student) {
      log(`Student ${studentId} not found`, "warn");
      return [];
    }

    log(`Starting balance update for student: ${student.fullName}`);
    const updates = [];

    for (const statement of student.feeStatements) {
      const updated = await updateSingleStatementBalance(statement.id);
      if (updated) updates.push(updated);
    }

    log(`Completed balance update for student ${student.fullName}: ${updates.length} statements updated`);
    return updates;
  } catch (error) {
    log(`Error updating balances for student ${studentId}: ${error.message}`, "error");
    throw error;
  }
};

/**
 * Update all balances for a specific term
 */
export const updateTermAllBalances = async (academicYear, term) => {
  try {
    log(`Starting balance update for term: ${academicYear} - ${term}`);

    // Get all students with fee statements for this term
    const students = await prisma.student.findMany({
      include: {
        feeStatements: {
          where: {
            academicYear,
            term,
          },
        },
      },
    });

    let updatedCount = 0;

    for (const student of students) {
      for (const statement of student.feeStatements) {
        const updated = await updateSingleStatementBalance(statement.id);
        if (updated) updatedCount++;
      }
    }

    log(`Completed balance update for ${academicYear} - ${term}: ${updatedCount} statements updated`);
    return updatedCount;
  } catch (error) {
    log(`Error updating balances for term ${academicYear} - ${term}: ${error.message}`, "error");
    throw error;
  }
};

/**
 * Update all balances for an academic year
 */
export const updateYearAllBalances = async (academicYear) => {
  try {
    log(`Starting balance update for academic year: ${academicYear}`);

    // Get all terms for this academic year
    const terms = await prisma.termDates.findMany({
      where: { academicYear },
    });

    let totalUpdated = 0;
    const results = [];

    for (const term of terms) {
      try {
        const count = await updateTermAllBalances(academicYear, term.term);
        results.push({
          term: term.term,
          count,
          status: "success",
        });
        totalUpdated += count;
      } catch (error) {
        results.push({
          term: term.term,
          status: "failed",
          error: error.message,
        });
      }
    }

    log(`Completed balance update for academic year ${academicYear}: ${totalUpdated} total statements updated across ${terms.length} terms`);
    return { totalUpdated, results };
  } catch (error) {
    log(`Error updating balances for academic year ${academicYear}: ${error.message}`, "error");
    throw error;
  }
};

/**
 * Update all balances for all active terms
 */
export const updateAllActiveTermsBalances = async () => {
  try {
    log("Starting balance update for all active terms");

    // Get all active terms
    const now = new Date();
    const activeTerms = await prisma.termDates.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (activeTerms.length === 0) {
      log("No active terms found");
      return { totalUpdated: 0, results: [] };
    }

    let totalUpdated = 0;
    const results = [];

    for (const term of activeTerms) {
      try {
        const count = await updateTermAllBalances(term.academicYear, term.term);
        results.push({
          academicYear: term.academicYear,
          term: term.term,
          count,
          status: "success",
        });
        totalUpdated += count;
      } catch (error) {
        results.push({
          academicYear: term.academicYear,
          term: term.term,
          status: "failed",
          error: error.message,
        });
      }
    }

    log(`Completed balance update for active terms: ${totalUpdated} total statements updated across ${activeTerms.length} terms`);
    return { totalUpdated, results };
  } catch (error) {
    log(`Error updating balances for active terms: ${error.message}`, "error");
    throw error;
  }
};

/**
 * Start scheduled balance updates
 * Updates active term balances every N minutes
 */
let balanceUpdateInterval = null;

export const startScheduledBalanceUpdates = (intervalMinutes = 5) => {
  if (balanceUpdateInterval) {
    log("Scheduled balance updates already running");
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  log(`Starting scheduled balance updates every ${intervalMinutes} minutes`);

  // Run immediately on start
  updateAllActiveTermsBalances().catch(error => {
    log(`Initial balance update failed: ${error.message}`, "error");
  });

  // Then run periodically
  balanceUpdateInterval = setInterval(async () => {
    try {
      log(`Running scheduled balance update (interval: ${intervalMinutes} minutes)`);
      const result = await updateAllActiveTermsBalances();
      log(`Scheduled update completed: ${result.totalUpdated} statements updated`);
    } catch (error) {
      log(`Scheduled balance update failed: ${error.message}`, "error");
    }
  }, intervalMs);

  log(`Scheduled balance updates started (interval: ${intervalMinutes} minutes)`);
};

/**
 * Stop scheduled balance updates
 */
export const stopScheduledBalanceUpdates = () => {
  if (balanceUpdateInterval) {
    clearInterval(balanceUpdateInterval);
    balanceUpdateInterval = null;
    log("Scheduled balance updates stopped");
  }
};

/**
 * Get balance update status
 */
export const getBalanceUpdateStatus = () => {
  return {
    isRunning: balanceUpdateInterval !== null,
    lastUpdate: new Date(),
    message: balanceUpdateInterval
      ? "Scheduled balance updates are running"
      : "Scheduled balance updates are not running",
  };
};

// Export all functions
export default {
  updateSingleStatementBalance,
  updateStudentAllBalances,
  updateTermAllBalances,
  updateYearAllBalances,
  updateAllActiveTermsBalances,
  startScheduledBalanceUpdates,
  stopScheduledBalanceUpdates,
  getBalanceUpdateStatus,
};
