import prisma from "../lib/prisma.js";
import { updateSingleStatementBalance } from "../lib/balanceUpdateService.js";
import { generatePaymentPDF, generateStatementPDF } from "../lib/pdfService.js";
import fs from "fs";
import path from "path";

// Generate unique reference number with counter to avoid duplicates in concurrent calls
let referenceCounter = null;

const initializeReferenceCounter = async () => {
  const lastPayment = await prisma.feePayment.findFirst({
    orderBy: { createdAt: "desc" },
  });

  referenceCounter = lastPayment
    ? parseInt(lastPayment.referenceNumber.split("-")[1])
    : 0;
};

const generateReferenceNumber = async () => {
  // Initialize counter if not already done
  if (referenceCounter === null) {
    await initializeReferenceCounter();
  }

  referenceCounter += 1;
  return `FEE-${String(referenceCounter).padStart(6, "0")}`;
};

// Get all fee payments
export const getAllFeePayments = async (req, res) => {
  try {
    const { studentId, classId, status } = req.query;
    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const payments = await prisma.feePayment.findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            fullName: true,
            status: true,
            class: {
              select: {
                id: true,
                className: true,
              },
            },
          },
        },
        classFee: true,
        studentFeeStatement: {
          select: {
            id: true,
            academicYear: true,
            term: true,
          },
        },
        receipts: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single fee payment
export const getFeePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        classFee: true,
        receipts: {
          orderBy: { createdAt: "desc" },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create fee payment for student
export const createFeePayment = async (req, res) => {
  try {
    console.log("[FEE PAYMENT] Received request body:", JSON.stringify(req.body, null, 2));
    
    const {
      studentId,
      studentFeeStatementId,
      classFeeId,
      academicYearTerm,
      academicYear,
      term,
      amount,
      paymentMethod,
      notes,
      createdById,
    } = req.body;

    // Validate required fields
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    if (!createdById) {
      return res.status(400).json({ message: "createdById is required" });
    }

    // Validate createdById format
    if (!createdById.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid createdById format" });
    }

    // Validate studentId format
    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let finalStudentFeeStatementId = studentFeeStatementId;
    let finalClassFeeId = classFeeId;
    let paymentAmount = amount;
    let finalAcademicYear = academicYear;
    let finalTerm = term;

    // If academicYearTerm provided (combined format like "2026-2027-term2"), parse it
    if (academicYearTerm) {
      console.log("[FEE PAYMENT] Parsing academicYearTerm:", academicYearTerm);
      // Format expected: "2026-2027-term2"
      // We need to extract: academicYear = "2026-2027" and term = "term2"
      const lastDashIndex = academicYearTerm.lastIndexOf('-');
      if (lastDashIndex > 0) {
        finalAcademicYear = academicYearTerm.substring(0, lastDashIndex);
        finalTerm = academicYearTerm.substring(lastDashIndex + 1);
        console.log("[FEE PAYMENT] Parsed -> academicYear:", finalAcademicYear, "term:", finalTerm);
      } else {
        console.log("[FEE PAYMENT] WARNING: Could not parse academicYearTerm format");
      }
    }

    // If academicYear and term provided, find or create the fee statement
    if (finalAcademicYear && finalTerm) {
      console.log("[FEE PAYMENT] Querying StudentFeeStatement with:", {
        studentId: student.id,
        academicYear: finalAcademicYear,
        term: finalTerm
      });
      
      let studentFeeStatement = await prisma.studentFeeStatement.findFirst({
        where: {
          studentId: student.id,
          academicYear: finalAcademicYear,
          term: finalTerm,
        },
      });

      // If statement doesn't exist, create one
      if (!studentFeeStatement) {
        console.log("[FEE PAYMENT] Fee statement not found, creating a new one");
        
        // Get the term dates for the selected academic year and term
        const termDates = await prisma.termDates.findFirst({
          where: {
            academicYear: finalAcademicYear,
            term: finalTerm,
          },
        });

        if (!termDates) {
          return res.status(404).json({
            message: `Academic term ${finalAcademicYear} - ${finalTerm} not found in the system`,
          });
        }

        // Get the class fee for this student's current class and term
        const classFeeForTerm = await prisma.classFee.findFirst({
          where: {
            classId: student.classId,
            term: finalTerm,
          },
        });

        if (!classFeeForTerm) {
          return res.status(404).json({
            message: `No fee amount configured for ${student.class.className} in ${finalTerm}`,
          });
        }

        // Create the fee statement
        studentFeeStatement = await prisma.studentFeeStatement.create({
          data: {
            studentId: student.id,
            academicYear: finalAcademicYear,
            term: finalTerm,
            studentClassName: student.class?.className || null,
            currentTermFee: classFeeForTerm.amount,
            previousBalance: 0,
            totalPayable: classFeeForTerm.amount,
            amountPaid: 0,
            balanceAmount: classFeeForTerm.amount,
            status: "pending",
            termStartDate: termDates.startDate,
            termEndDate: termDates.endDate,
            dueDate: termDates.endDate,
          },
        });

        console.log("[FEE PAYMENT] Created new fee statement:", studentFeeStatement.id);
      }

      console.log("[FEE PAYMENT] Using fee statement:", studentFeeStatement.id);
      finalStudentFeeStatementId = studentFeeStatement.id;
      paymentAmount = paymentAmount || studentFeeStatement.balanceAmount;
    } 
    // If classFeeId provided, get the class fee and find matching fee statement
    else if (classFeeId) {
      // Validate classFeeId format
      if (!classFeeId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid classFeeId format" });
      }

      const classFee = await prisma.classFee.findUnique({
        where: { id: classFeeId },
      });

      if (!classFee) {
        return res.status(404).json({ message: "Class fee not found" });
      }

      // Find the appropriate StudentFeeStatement for this student in this term
      const studentFeeStatement = await prisma.studentFeeStatement.findFirst({
        where: {
          studentId: student.id,
          term: classFee.term,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!studentFeeStatement) {
        return res.status(404).json({ 
          message: `No fee statement found for student in ${classFee.term}` 
        });
      }

      finalStudentFeeStatementId = studentFeeStatement.id;
      paymentAmount = paymentAmount || classFee.amount;
    } 
    // If studentFeeStatementId provided
    else if (studentFeeStatementId) {
      // Validate studentFeeStatementId format
      if (!studentFeeStatementId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid studentFeeStatementId format" });
      }

      const studentFeeStatement = await prisma.studentFeeStatement.findUnique({
        where: { id: studentFeeStatementId },
      });

      if (!studentFeeStatement) {
        return res.status(404).json({ message: "Fee statement not found" });
      }

      // Verify the fee statement belongs to this student
      if (studentFeeStatement.studentId !== studentId) {
        return res.status(400).json({ 
          message: "Fee statement does not belong to this student" 
        });
      }

      // Default amount to the total payable if not specified
      paymentAmount = paymentAmount || studentFeeStatement.balanceAmount;
      finalStudentFeeStatementId = studentFeeStatementId;
    }
    // If neither provided, find the latest pending fee statement for this student
    else {
      const latestFeeStatement = await prisma.studentFeeStatement.findFirst({
        where: {
          studentId: student.id,
          status: "pending",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!latestFeeStatement) {
        return res.status(404).json({ 
          message: "No pending fee statement found for this student. Please provide studentFeeStatementId, academicYear/term, or classFeeId." 
        });
      }

      finalStudentFeeStatementId = latestFeeStatement.id;
      // Default amount to outstanding balance if not specified
      paymentAmount = paymentAmount || latestFeeStatement.balanceAmount;
    }

    // Validate payment amount
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    // Initialize reference number counter to avoid duplicates
    await initializeReferenceCounter();

    // Check for previous term arrears before creating payment
    // Get the current statement to check term
    const currentStatement = await prisma.studentFeeStatement.findUnique({
      where: { id: finalStudentFeeStatementId },
    });

    let remainingPaymentAmount = parseFloat(paymentAmount);
    console.log("[FEE PAYMENT] Payment amount:", remainingPaymentAmount);
    console.log("[FEE PAYMENT] Current statement term:", currentStatement.term, "academic year:", currentStatement.academicYear);

    // Find all previous term statements with outstanding balance
    const previousStatements = await prisma.studentFeeStatement.findMany({
      where: {
        studentId: student.id,
        status: "pending",
        balanceAmount: { gt: 0 }, // Only statements with outstanding balance
      },
      orderBy: [{ academicYear: "asc" }, { term: "asc" }], // Order by academic year and term
    });

    console.log("[FEE PAYMENT] Found", previousStatements.length, "previous statements with balance");

    // Clear previous term arrears first
    for (const prevStatement of previousStatements) {
      // Check if this statement is actually from a previous term
      const isCurrentStatement = prevStatement.id === finalStudentFeeStatementId;
      if (isCurrentStatement) {
        console.log("[FEE PAYMENT] Skipping current statement");
        continue;
      }

      if (remainingPaymentAmount <= 0) {
        console.log("[FEE PAYMENT] No remaining amount to allocate to previous terms");
        break;
      }

      console.log("[FEE PAYMENT] Processing previous statement:", prevStatement.id, "with balance:", prevStatement.balanceAmount);

      // Allocate payment to this previous statement
      const allocationAmount = Math.min(remainingPaymentAmount, prevStatement.balanceAmount);
      console.log("[FEE PAYMENT] Allocating", allocationAmount, "to previous statement");

      // Generate unique reference number for this arrears payment
      const arrearsReferenceNumber = await generateReferenceNumber();

      // Create fee payment for previous statement
      await prisma.feePayment.create({
        data: {
          referenceNumber: arrearsReferenceNumber,
          studentId,
          studentFeeStatementId: prevStatement.id,
          classFeeId: null,
          amount: allocationAmount,
          paymentMethod: paymentMethod || "cash",
          paymentDate: new Date(),
          status: "completed",
          notes: `Payment allocated from current term payment to clear ${prevStatement.academicYear} - ${prevStatement.term} arrears`,
          createdById,
          studentClassName: student.class?.className || null,
        },
      });

      // Update the previous statement balance
      const previousTotalPaid = await prisma.feePayment.aggregate({
        where: {
          studentFeeStatementId: prevStatement.id,
          status: "completed",
        },
        _sum: { amount: true },
      });

      const previousAmountPaid = previousTotalPaid._sum.amount || 0;
      const previousNewBalance = Math.max(0, prevStatement.totalPayable - previousAmountPaid);

      await prisma.studentFeeStatement.update({
        where: { id: prevStatement.id },
        data: {
          amountPaid: previousAmountPaid,
          balanceAmount: previousNewBalance,
          status: previousNewBalance === 0 ? "completed" : "pending",
        },
      });

      console.log("[FEE PAYMENT] Updated previous statement balance to:", previousNewBalance);

      // Reduce remaining payment amount
      remainingPaymentAmount -= allocationAmount;
      console.log("[FEE PAYMENT] Remaining amount to allocate:", remainingPaymentAmount);
    }

    // Create fee payment for current term with remaining amount
    const currentTermPaymentAmount = Math.max(0, remainingPaymentAmount);
    console.log("[FEE PAYMENT] Creating payment for current term with amount:", currentTermPaymentAmount);

    // Generate unique reference number for current term payment
    const currentTermReferenceNumber = await generateReferenceNumber();

    const feePayment = await prisma.feePayment.create({
      data: {
        referenceNumber: currentTermReferenceNumber,
        studentId,
        studentFeeStatementId: finalStudentFeeStatementId,
        classFeeId: finalClassFeeId,
        amount: currentTermPaymentAmount,
        paymentMethod: paymentMethod || "cash",
        paymentDate: new Date(),
        status: "completed",
        notes: notes || null,
        createdById,
        studentClassName: student.class?.className || null,
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            fullName: true,
          },
        },
        classFee: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Update current StudentFeeStatement to recalculate balance
    // Balance = totalPayable - total amount paid (sum of all completed payments)
    const totalPaid = await prisma.feePayment.aggregate({
      where: {
        studentFeeStatementId: finalStudentFeeStatementId,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id: finalStudentFeeStatementId },
    });

    const amountPaid = totalPaid._sum.amount || 0;
    const newBalanceAmount = Math.max(0, statement.totalPayable - amountPaid);

    // Update the statement with calculated amounts
    await prisma.studentFeeStatement.update({
      where: { id: finalStudentFeeStatementId },
      data: {
        amountPaid: amountPaid,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount === 0 ? "completed" : "pending",
      },
    });

    // Also trigger balance update through the service for consistency
    try {
      await updateSingleStatementBalance(finalStudentFeeStatementId);
    } catch (error) {
      console.error("Warning: Could not update statement balance through service:", error.message);
      // Continue - manual update above succeeded
    }

    res.status(201).json(feePayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record payment for fee
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod,
      paymentDate,
      notes,
    } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    // Verify payment exists
    const feePayment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        studentFeeStatement: true,
        receipts: true,
      },
    });

    if (!feePayment) {
      return res.status(404).json({ message: "Fee payment not found" });
    }

    const parsedAmount = parseFloat(amount);

    // Create receipt
    const lastReceipt = await prisma.receipt.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const receiptNumber = `RCP-${String((lastReceipt ? parseInt(lastReceipt.receiptNumber.split("-")[1]) + 1 : 1).toString().padStart(6, "0"))}`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        studentId: feePayment.studentId,
        feePaymentId: id,
        amount: parsedAmount,
        paymentMethod,
        paymentDate: new Date(paymentDate) || new Date(),
        description: notes || null,
      },
    });

    // Update fee payment status
    const updatedPayment = await prisma.feePayment.update({
      where: { id },
      data: {
        status: "completed",
        paymentDate: new Date(paymentDate) || new Date(),
        notes: notes || undefined,
      },
      include: {
        student: true,
        classFee: true,
        studentFeeStatement: true,
        receipts: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Recalculate StudentFeeStatement balance
    // Balance = totalPayable - total amount paid (sum of all completed payments)
    const totalPaid = await prisma.feePayment.aggregate({
      where: {
        studentFeeStatementId: feePayment.studentFeeStatementId,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id: feePayment.studentFeeStatementId },
    });

    const amountPaid = totalPaid._sum.amount || 0;
    const newBalanceAmount = Math.max(0, statement.totalPayable - amountPaid);

    // Update the statement with recalculated amounts
    await prisma.studentFeeStatement.update({
      where: { id: feePayment.studentFeeStatementId },
      data: {
        amountPaid: amountPaid,
        balanceAmount: newBalanceAmount,
        status: newBalanceAmount === 0 ? "completed" : "pending",
      },
    });

    // Also trigger balance update through the service for consistency
    try {
      await updateSingleStatementBalance(feePayment.studentFeeStatementId);
    } catch (error) {
      console.error("Warning: Could not update statement balance through service:", error.message);
      // Continue - manual update above succeeded
    }

    res.status(200).json({
      payment: updatedPayment,
      receipt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update fee payment
export const updateFeePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, notes } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    // Verify payment exists
    const paymentExists = await prisma.feePayment.findUnique({
      where: { id },
    });

    if (!paymentExists) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const updatedPayment = await prisma.feePayment.update({
      where: { id },
      data: {
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
      },
      include: {
        student: true,
        classFee: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete fee payment
export const deleteFeePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    // Verify payment exists
    const paymentExists = await prisma.feePayment.findUnique({
      where: { id },
      include: { receipts: true },
    });

    if (!paymentExists) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if there are receipts
    if (paymentExists.receipts.length > 0) {
      return res
        .status(400)
        .json({
          message:
            "Cannot delete payment with receipts. Please delete receipts first.",
        });
    }

    // Store the fee statement ID before deleting
    const feeStatementId = paymentExists.studentFeeStatementId;

    // Delete payment
    await prisma.feePayment.delete({
      where: { id },
    });

    // Recalculate StudentFeeStatement balance after deletion
    // Balance = totalPayable - total amount paid (sum of all completed payments)
    const totalPaid = await prisma.feePayment.aggregate({
      where: {
        studentFeeStatementId: feeStatementId,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id: feeStatementId },
    });

    if (statement) {
      const amountPaid = totalPaid._sum.amount || 0;
      const newBalanceAmount = Math.max(0, statement.totalPayable - amountPaid);

      // Update the statement with recalculated amounts
      await prisma.studentFeeStatement.update({
        where: { id: feeStatementId },
        data: {
          amountPaid: amountPaid,
          balanceAmount: newBalanceAmount,
          status: newBalanceAmount === 0 ? "completed" : "pending",
        },
      });

      // Also trigger balance update through the service for consistency
      try {
        await updateSingleStatementBalance(feeStatementId);
      } catch (error) {
        console.error("Warning: Could not update statement balance through service:", error.message);
        // Continue - manual update above succeeded
      }
    }

    res.status(200).json({ message: "Fee payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
  try {
    const payments = await prisma.feePayment.findMany({
      include: {
        student: true,
        receipts: true,
      },
    });

    const stats = {
      total: payments.length,
      completed: payments.filter((p) => p.status === "completed").length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      cancelled: payments.filter((p) => p.status === "cancelled").length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments.reduce((sum, p) => sum + p.receipts.reduce((s, r) => s + r.amount, 0), 0),
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate payment PDF
export const generatePaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    // Get the fee payment details
    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        classFee: true,
        studentFeeStatement: true,
        receipts: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Generate the PDF receipt
    const pdfBuffer = await generatePaymentPDF(payment);

    // Save the PDF to file system (optional)
    const filePath = path.join(__dirname, `../../receipts/receipt_${id}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=receipt_${id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate statement PDF
export const generateStatement = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Get the student fee statements
    const statements = await prisma.studentFeeStatement.findMany({
      where: { studentId: id },
      include: {
        student: true,
        class: true,
        termDates: true,
        feePayments: true,
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    if (!statements || statements.length === 0) {
      return res.status(404).json({ message: "No fee statements found for this student" });
    }

    // Generate the PDF statement
    const pdfBuffer = await generateStatementPDF(statements);

    // Save the PDF to file system (optional)
    const filePath = path.join(__dirname, `../../statements/statement_${id}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=statement_${id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export fee payment as PDF
export const exportPaymentPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee payment ID is required" });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee payment ID format" });
    }

    // Fetch payment with all related data
    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        studentFeeStatement: {
          include: {
            feePayments: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Generate PDF
    const pdfPath = await generatePaymentPDF(payment);

    // Send file
    const fileName = `payment-${payment.referenceNumber}.pdf`;
    res.download(pdfPath, fileName, (err) => {
      if (err) {
        console.error("Error downloading PDF:", err);
      }
      // Clean up file after download
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting PDF:", unlinkErr);
      });
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export fee statement as PDF
export const exportStatementPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Fee statement ID is required" });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid fee statement ID format" });
    }

    // Fetch statement with all related data
    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            status: true,
          },
        },
        feePayments: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!statement) {
      return res.status(404).json({ message: "Fee statement not found" });
    }

    // Generate PDF
    const pdfPath = await generateStatementPDF(statement);

    // Send file
    const fileName = `statement-${statement.student.admissionNumber}-${statement.academicYear}-${statement.term}.pdf`;
    res.download(pdfPath, fileName, (err) => {
      if (err) {
        console.error("Error downloading PDF:", err);
      }
      // Clean up file after download
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting PDF:", unlinkErr);
      });
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export all payments for a student as PDF
export const exportStudentPaymentsPDF = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate ID format
    if (!studentId || studentId === "undefined") {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Fetch all payments for student
    const payments = await prisma.feePayment.findMany({
      where: { studentId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        studentFeeStatement: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (payments.length === 0) {
      return res.status(404).json({ message: "No payments found for this student" });
    }

    const student = payments[0].student;

    // Generate PDFs for each payment
    const pdfPaths = [];
    for (const payment of payments) {
      try {
        const pdfPath = await generatePaymentPDF(payment);
        pdfPaths.push(pdfPath);
      } catch (err) {
        console.error(`Error generating PDF for payment ${payment.id}:`, err);
      }
    }

    if (pdfPaths.length === 0) {
      return res.status(500).json({ message: "Failed to generate PDFs" });
    }

    // If only one PDF, send it directly
    if (pdfPaths.length === 1) {
      const fileName = `payments-${student.admissionNumber}.pdf`;
      res.download(pdfPaths[0], fileName, (err) => {
        if (err) console.error("Error downloading PDF:", err);
        fs.unlink(pdfPaths[0], (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting PDF:", unlinkErr);
        });
      });
    } else {
      // For multiple PDFs, return them as JSON with download URLs
      res.status(200).json({
        message: `Generated ${pdfPaths.length} PDFs`,
        count: pdfPaths.length,
        files: pdfPaths.map((filePath, index) => ({
          index: index + 1,
          payment: payments[index],
          path: filePath,
        })),
      });
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export all statements for a student as PDF
export const exportStudentStatementsPDF = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate ID format
    if (!studentId || studentId === "undefined") {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Fetch all statements for student
    const statements = await prisma.studentFeeStatement.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            status: true,
          },
        },
        feePayments: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    });

    if (statements.length === 0) {
      return res.status(404).json({ message: "No fee statements found for this student" });
    }

    const student = statements[0].student;

    // Generate PDFs for each statement
    const pdfPaths = [];
    for (const statement of statements) {
      try {
        const pdfPath = await generateStatementPDF(statement);
        pdfPaths.push(pdfPath);
      } catch (err) {
        console.error(`Error generating PDF for statement ${statement.id}:`, err);
      }
    }

    if (pdfPaths.length === 0) {
      return res.status(500).json({ message: "Failed to generate PDFs" });
    }

    // If only one PDF, send it directly
    if (pdfPaths.length === 1) {
      const stmt = statements[0];
      const fileName = `statement-${student.admissionNumber}-${stmt.academicYear}-${stmt.term}.pdf`;
      res.download(pdfPaths[0], fileName, (err) => {
        if (err) console.error("Error downloading PDF:", err);
        fs.unlink(pdfPaths[0], (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting PDF:", unlinkErr);
        });
      });
    } else {
      // For multiple PDFs, return them as JSON with info
      res.status(200).json({
        message: `Generated ${pdfPaths.length} PDFs`,
        count: pdfPaths.length,
        studentInfo: {
          id: student.id,
          name: student.fullName,
          admissionNumber: student.admissionNumber,
        },
        files: pdfPaths.map((filePath, index) => ({
          index: index + 1,
          academicYear: statements[index].academicYear,
          term: statements[index].term,
          path: filePath,
        })),
      });
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};
