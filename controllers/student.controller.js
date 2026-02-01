import prisma from "../lib/prisma.js";
import { getActiveTerms } from "./academicTerm.controller.js";

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const { classId, status } = req.query;
    const filter = {};

    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    const students = await prisma.student.findMany({
      where: filter,
      include: {
        class: true,
        feePayments: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            amount: true,
            paymentDate: true,
          },
          orderBy: { createdAt: "desc" },
        },
        feeStatements: {
          select: {
            id: true,
            academicYear: true,
            term: true,
            totalPayable: true,
            amountPaid: true,
            balanceAmount: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single student
export const getStudent = async (req, res) => {
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

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        feePayments: {
          include: {
            classFee: true,
            receipts: true,
          },
          orderBy: { createdAt: "desc" },
        },
        feeStatements: {
          select: {
            id: true,
            academicYear: true,
            term: true,
            totalPayable: true,
            amountPaid: true,
            balanceAmount: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        },
        receipts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new student
export const createStudent = async (req, res) => {
  try {
    const {
      admissionNumber,
      fullName,
      gender,
      parentName,
      parentPhone,
      classId,
    } = req.body;

    // Validate fullName
    if (!fullName) {
      return res.status(400).json({ 
        message: "Full name is required" 
      });
    }

    const nameParts = fullName.trim().split(/\s+/);
    
    // Check if at least 2 names provided
    if (nameParts.length < 2) {
      return res.status(400).json({ 
        message: "Full name must contain at least 2 names (e.g., Andrew Young)" 
      });
    }

    // Check if each name starts with capital letter
    const isValidFormat = nameParts.every(part => {
      return /^[A-Z][a-z]*$/.test(part);
    });

    if (!isValidFormat) {
      return res.status(400).json({ 
        message: "Each name must start with a capital letter (e.g., Andrew Young)" 
      });
    }

    // Check if admission number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber },
    });

    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this admission number already exists" });
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Create student and fee statements in transaction
    const student = await prisma.student.create({
      data: {
        admissionNumber,
        fullName,
        gender: gender || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        classId,
      },
      include: {
        class: true,
      },
    });

    // Automatically create fee statements for active terms
    try {
      await createFeeStatementsForStudent(student.id, classId);
    } catch (error) {
      console.error("Error creating fee statements:", error);
      // Don't fail the student creation if fee statement fails
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to create fee statements for a student
const createFeeStatementsForStudent = async (studentId, classId) => {
  try {
    // Get active term dates
    const activeTerms = await getActiveTerms();

    if (activeTerms.length === 0) {
      console.log("No active terms found");
      return;
    }

    // For each active term, create a fee statement
    for (const termDate of activeTerms) {
      // Get the class fee for this term
      const classFee = await prisma.classFee.findUnique({
        where: {
          classId_term: {
            classId,
            term: termDate.term,
          },
        },
      });

      if (!classFee) {
        console.log(`No class fee found for class ${classId} and term ${termDate.term}`);
        continue;
      }

      // Check if statement already exists
      const existingStatement = await prisma.studentFeeStatement.findUnique({
        where: {
          studentId_academicYear_term: {
            studentId,
            academicYear: termDate.academicYear,
            term: termDate.term,
          },
        },
      });

      if (existingStatement) {
        console.log(`Fee statement already exists for student ${studentId}`);
        continue;
      }

      // Get previous balance from last term if it exists
      let previousBalance = 0;
      const previousTerm = await prisma.studentFeeStatement.findFirst({
        where: {
          studentId,
          academicYear: termDate.academicYear,
        },
        orderBy: { createdAt: "desc" },
      });

      if (previousTerm) {
        previousBalance = previousTerm.balanceAmount || 0;
      }

      // Create fee statement
      await prisma.studentFeeStatement.create({
        data: {
          studentId,
          academicYear: termDate.academicYear,
          term: termDate.term,
          currentTermFee: classFee.amount,
          previousBalance: previousBalance, // Carry forward balance from previous term
          totalPayable: previousBalance + classFee.amount, // previousBalance + currentTermFee
          amountPaid: 0,
          balanceAmount: previousBalance + classFee.amount, // totalPayable - amountPaid
          status: "pending",
          termStartDate: termDate.startDate,
          termEndDate: termDate.endDate,
          dueDate: termDate.endDate, // Due by end of term
        },
      });

      console.log(`Fee statement created for student ${studentId} - ${termDate.academicYear} ${termDate.term}`);
    }
  } catch (error) {
    console.error("Error in createFeeStatementsForStudent:", error);
    throw error;
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      gender,
      parentName,
      parentPhone,
      classId,
      status,
    } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Verify student exists
    const studentExists = await prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Validate fullName if provided
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      
      // Check if at least 2 names provided
      if (nameParts.length < 2) {
        return res.status(400).json({ 
          message: "Full name must contain at least 2 names (e.g., Andrew Young)" 
        });
      }

      // Check if each name starts with capital letter
      const isValidFormat = nameParts.every(part => {
        return /^[A-Z][a-z]*$/.test(part);
      });

      if (!isValidFormat) {
        return res.status(400).json({ 
          message: "Each name must start with a capital letter (e.g., Andrew Young)" 
        });
      }
    }

    // Track if class changed
    const classChanged = classId && classId !== studentExists.classId;

    // If classId provided, verify it exists
    if (classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        return res.status(404).json({ message: "Class not found" });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        fullName: fullName || undefined,
        gender: gender || undefined,
        parentName: parentName || undefined,
        parentPhone: parentPhone || undefined,
        classId: classId || undefined,
        status: status || undefined,
      },
      include: {
        class: true,
      },
    });

    // If class changed, update the active term's fee statement
    if (classChanged) {
      try {
        await updateActiveTermFeeStatementOnClassChange(id, classId);
        console.log(`Active term fee statement updated for student after class change`);
      } catch (error) {
        console.error("Error updating fee statement after class change:", error);
        // Don't fail the update if fee statement update fails
      }
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update fee statement when student's class changes
// For the active term, updates totalPayable = new class fee, amountPaid = 0, balanceAmount = totalPayable
const updateActiveTermFeeStatementOnClassChange = async (studentId, newClassId) => {
  try {
    // Get all active terms
    const activeTerms = await getActiveTerms();

    if (activeTerms.length === 0) {
      console.log("No active terms found");
      return;
    }

    // For each active term, update the student's fee statement
    for (const activeTerm of activeTerms) {
      // Get the fee statement for this student in this active term
      const existingStatement = await prisma.studentFeeStatement.findUnique({
        where: {
          studentId_academicYear_term: {
            studentId,
            academicYear: activeTerm.academicYear,
            term: activeTerm.term,
          },
        },
      });

      if (!existingStatement) {
        // No statement exists for this term yet, skip
        console.log(`No fee statement found for student ${studentId} in ${activeTerm.term}`);
        continue;
      }

      // Get the class fee for the new class in this term
      const newClassFee = await prisma.classFee.findUnique({
        where: {
          classId_term: {
            classId: newClassId,
            term: activeTerm.term,
          },
        },
        include: {
          class: true,
        },
      });

      if (!newClassFee) {
        console.log(`No class fee found for class ${newClassId} and term ${activeTerm.term}`);
        continue;
      }

      // Update the fee statement when class changes
      // Set totalPayable = balanceAmount (keep the current balance as the new total)
      // Set amountPaid = 0 (zero out previous payments)
      // So totalPayable === balanceAmount after class change
      // Also update studentClassName to reflect the new class
      const newTotalPayable = existingStatement.balanceAmount;
      const newAmountPaid = 0;
      const newBalance = newTotalPayable;

      await prisma.studentFeeStatement.update({
        where: { id: existingStatement.id },
        data: {
          studentClassName: newClassFee.class.className, // Update class snapshot
          currentTermFee: newClassFee.amount,
          totalPayable: newTotalPayable,
          amountPaid: newAmountPaid,
          balanceAmount: newBalance,
          status: "pending",
        },
      });

      console.log(`Fee statement updated for student ${studentId} in ${activeTerm.term}: new class = ${newClassFee.class.className}, previous balance = ${existingStatement.balanceAmount}, totalPayable = ${newTotalPayable}, amountPaid = ${newAmountPaid}, balanceAmount = ${newBalance}`);
    }
  } catch (error) {
    console.error("Error in updateActiveTermFeeStatementOnClassChange:", error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
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

    // Verify student exists
    const studentExists = await prisma.student.findUnique({
      where: { id },
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete student (receipts and feePayments will be cascaded)
    await prisma.student.delete({
      where: { id },
    });

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student fee summary
export const getStudentFeeSummary = async (req, res) => {
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

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        feePayments: {
          include: {
            classFee: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const totalAmount = student.feePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalPaid = student.feePayments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );
    const totalBalance = totalAmount - totalPaid;
    const pendingCount = student.feePayments.filter(
      (p) => p.status === "pending"
    ).length;

    res.status(200).json({
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      summary: {
        totalAmount,
        totalPaid,
        totalBalance,
        pendingCount,
        completedCount: student.feePayments.filter((p) => p.status === "completed").length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
