import prisma from "../lib/prisma.js";

// Helper function to determine if a term is active based on current date
const isTermActive = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
};

// Helper function to update all student balances for a specific term
const updateStudentBalancesForTerm = async (academicYear, term) => {
  try {
    console.log(`[BALANCE UPDATE] Starting balance update for ${academicYear} - ${term}`);
    
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
        // Calculate total amount paid for this statement
        const totalPaid = await prisma.feePayment.aggregate({
          where: {
            studentFeeStatementId: statement.id,
            status: "completed",
          },
          _sum: {
            amount: true,
          },
        });

        const amountPaid = totalPaid._sum.amount || 0;
        const newBalanceAmount = Math.max(0, statement.totalPayable - amountPaid);

        // Update the statement
        await prisma.studentFeeStatement.update({
          where: { id: statement.id },
          data: {
            amountPaid,
            balanceAmount: newBalanceAmount,
            status: newBalanceAmount === 0 ? "completed" : "pending",
          },
        });

        updatedCount++;
      }
    }

    console.log(`[BALANCE UPDATE] Updated ${updatedCount} student balances for ${academicYear} - ${term}`);
    return updatedCount;
  } catch (error) {
    console.error(`[BALANCE UPDATE ERROR] Error updating balances for ${academicYear} - ${term}:`, error);
    throw error;
  }
};

// Helper function to add status based on current date
const addTermStatus = (term) => {
  if (!term) return null;
  return {
    ...term,
    status: isTermActive(term.startDate, term.endDate) ? "active" : "inactive",
  };
};

// Helper function to get all active terms (exported for use in other controllers)
export const getActiveTerms = async () => {
  try {
    const activeTerms = await prisma.termDates.findMany({
      where: {
        // Filter by date range
      },
    });

    // Filter by computing status
    return activeTerms
      .map(addTermStatus)
      .filter(term => term.status === "active");
  } catch (error) {
    console.error("Error fetching active terms:", error);
    return [];
  }
};

// Export balance update helper for use in other controllers
export { updateStudentBalancesForTerm };

// Get all academic terms
export const getAllTerms = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const filter = {};

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    const terms = await prisma.termDates.findMany({
      where: filter,
      orderBy: [{ academicYear: "desc" }, { term: "asc" }],
    });

    // Add computed status based on current date
    const termsWithStatus = terms.map(addTermStatus);

    res.status(200).json(termsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single term
export const getTerm = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Term ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid term ID format" });
    }

    const term = await prisma.termDates.findUnique({
      where: { id },
    });

    if (!term) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Add computed status
    const termWithStatus = addTermStatus(term);

    res.status(200).json(termWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get term by academic year and term
export const getTermByYearAndTerm = async (req, res) => {
  try {
    const { academicYear, term } = req.params;

    const termData = await prisma.termDates.findUnique({
      where: {
        academicYear_term: {
          academicYear,
          term,
        },
      },
    });

    if (!termData) {
      return res.status(404).json({
        message: `Term ${term} not found for academic year ${academicYear}`,
      });
    }

    // Add computed status
    const termWithStatus = addTermStatus(termData);

    res.status(200).json(termWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new term
export const createTerm = async (req, res) => {
  try {
    const { academicYear, term, startDate, endDate } = req.body;

    // Validate required fields
    if (!academicYear || !term || !startDate || !endDate) {
      return res.status(400).json({
        message: "academicYear, term, startDate, and endDate are required",
      });
    }

    // Validate term value
    const validTerms = ["term1", "term2", "term3"];
    if (!validTerms.includes(term)) {
      return res.status(400).json({
        message: "term must be one of: term1, term2, term3",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        message: "startDate must be before endDate",
      });
    }

    // Check if term already exists for this academic year
    const existingTerm = await prisma.termDates.findUnique({
      where: {
        academicYear_term: {
          academicYear,
          term,
        },
      },
    });

    if (existingTerm) {
      return res.status(400).json({
        message: `Term ${term} already exists for academic year ${academicYear}`,
      });
    }

    const newTerm = await prisma.termDates.create({
      data: {
        academicYear,
        term,
        startDate: start,
        endDate: end,
        status: isTermActive(start, end) ? "active" : "inactive",
      },
    });

    res.status(201).json(addTermStatus(newTerm));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update term
export const updateTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { academicYear, term, startDate, endDate } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Term ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid term ID format" });
    }

    // Verify term exists
    const existingTerm = await prisma.termDates.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return res.status(404).json({ message: "Term not found" });
    }

    // Validate term value if provided
    if (term) {
      const validTerms = ["term1", "term2", "term3"];
      if (!validTerms.includes(term)) {
        return res.status(400).json({
          message: "term must be one of: term1, term2, term3",
        });
      }

      // Check for duplicate if changing term
      if (term !== existingTerm.term) {
        const duplicateTerm = await prisma.termDates.findUnique({
          where: {
            academicYear_term: {
              academicYear: academicYear || existingTerm.academicYear,
              term,
            },
          },
        });

        if (duplicateTerm) {
          return res.status(400).json({
            message: `Term ${term} already exists for this academic year`,
          });
        }
      }
    }

    // Validate dates if provided
    let start = existingTerm.startDate;
    let end = existingTerm.endDate;

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        message: "startDate must be before endDate",
      });
    }

    const updatedTerm = await prisma.termDates.update({
      where: { id },
      data: {
        academicYear: academicYear || undefined,
        term: term || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: isTermActive(start, end) ? "active" : "inactive",
      },
    });

    // Trigger automatic balance update for all students in this term
    try {
      const updateCount = await updateStudentBalancesForTerm(
        updatedTerm.academicYear,
        updatedTerm.term
      );
      console.log(`[TERM UPDATE] Term updated and ${updateCount} student balances recalculated`);
    } catch (error) {
      console.error("[TERM UPDATE] Failed to update student balances:", error);
      // Continue with response even if balance update fails
    }

    res.status(200).json(addTermStatus(updatedTerm));
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "This academic year and term combination already exists",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete term
export const deleteTerm = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Term ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid term ID format" });
    }

    // Verify term exists
    const termExists = await prisma.termDates.findUnique({
      where: { id },
    });

    if (!termExists) {
      return res.status(404).json({ message: "Term not found" });
    }

    await prisma.termDates.delete({
      where: { id },
    });

    res.status(200).json({ message: "Term deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active term (term that is currently happening)
export const getActiveTerm = async (req, res) => {
  try {
    const now = new Date();

    const activeTerm = await prisma.termDates.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: "desc" },
    });

    if (!activeTerm) {
      return res.status(404).json({ message: "No active term found" });
    }

    res.status(200).json(addTermStatus(activeTerm));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all active terms for an academic year
export const getActiveTermsByYear = async (req, res) => {
  try {
    const { academicYear } = req.params;
    const now = new Date();

    const activeTerms = await prisma.termDates.findMany({
      where: {
        academicYear,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { term: "asc" },
    });

    const termsWithStatus = activeTerms.map(addTermStatus);

    res.status(200).json(termsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manually trigger balance recalculation for a specific term
export const recalculateTermBalances = async (req, res) => {
  try {
    const { academicYear, term } = req.params;

    // Verify term exists
    const termExists = await prisma.termDates.findUnique({
      where: {
        academicYear_term: {
          academicYear,
          term,
        },
      },
    });

    if (!termExists) {
      return res.status(404).json({
        message: `Term ${term} not found for academic year ${academicYear}`,
      });
    }

    // Trigger balance update
    const updatedCount = await updateStudentBalancesForTerm(academicYear, term);

    res.status(200).json({
      message: `Successfully recalculated balances for ${updatedCount} students`,
      academicYear,
      term,
      updatedCount,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate balances for all terms in an academic year
export const recalculateYearBalances = async (req, res) => {
  try {
    const { academicYear } = req.params;

    // Get all terms for this academic year
    const terms = await prisma.termDates.findMany({
      where: { academicYear },
    });

    if (terms.length === 0) {
      return res.status(404).json({
        message: `No terms found for academic year ${academicYear}`,
      });
    }

    const results = [];
    let totalUpdated = 0;

    for (const term of terms) {
      try {
        const updatedCount = await updateStudentBalancesForTerm(academicYear, term.term);
        results.push({
          term: term.term,
          updatedCount,
          status: "success",
        });
        totalUpdated += updatedCount;
      } catch (error) {
        results.push({
          term: term.term,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: `Balance recalculation completed for academic year ${academicYear}`,
      academicYear,
      totalTerms: terms.length,
      totalStudentsUpdated: totalUpdated,
      results,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recalculate balances for all active terms
export const recalculateAllActiveTermsBalances = async (req, res) => {
  try {
    const activeTerms = await getActiveTerms();

    if (activeTerms.length === 0) {
      return res.status(200).json({
        message: "No active terms found",
        results: [],
        timestamp: new Date(),
      });
    }

    const results = [];
    let totalUpdated = 0;

    for (const term of activeTerms) {
      try {
        const updatedCount = await updateStudentBalancesForTerm(term.academicYear, term.term);
        results.push({
          academicYear: term.academicYear,
          term: term.term,
          updatedCount,
          status: "success",
        });
        totalUpdated += updatedCount;
      } catch (error) {
        results.push({
          academicYear: term.academicYear,
          term: term.term,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: `Balance recalculation completed for all active terms`,
      totalActiveTerms: activeTerms.length,
      totalStudentsUpdated: totalUpdated,
      results,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
