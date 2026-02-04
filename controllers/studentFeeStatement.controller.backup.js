import prisma from "../lib/prisma.js";
import { generateStatementPDF } from "../lib/pdfService.js";
import fs from "fs";

export const getAllStudentFeeStatements = async (req, res) => {
  try {
    const { studentId, academicYear, term, status } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (status) filter.status = status;
    const statements = await prisma.studentFeeStatement.findMany({
      where: filter,
      include: {
        student: { include: { class: true } },
        feePayments: { include: { classFee: true, createdBy: true, receipts: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(statements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentFeeStatement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ message: "Fee statement ID is required" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid fee statement ID format" });
    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id },
      include: {
        student: { include: { class: true } },
        feePayments: { include: { classFee: true, createdBy: true, receipts: true }, orderBy: { paymentDate: "desc" } },
      },
    });
    if (!statement) return res.status(404).json({ message: "Fee statement not found" });
    res.status(200).json(statement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportStatementAsPDF = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ message: "Fee statement ID is required" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid fee statement ID format" });
    const statement = await prisma.studentFeeStatement.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true, status: true } },
        feePayments: { include: { createdBy: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!statement) return res.status(404).json({ message: "Fee statement not found" });
    const pdfPath = await generateStatementPDF(statement);
    const fileName = `statement-${statement.student.admissionNumber}-${statement.academicYear}-${statement.term}.pdf`;
    res.download(pdfPath, fileName, (err) => {
      if (err) console.error("Error downloading PDF:", err);
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting PDF:", unlinkErr);
      });
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createStudentFeeStatement = async (req, res) => {
  try {
    const { studentId, academicYear, term, termStartDate, termEndDate, dueDate } = req.body;
    if (!studentId || !academicYear || !term) return res.status(400).json({ message: "Missing required fields: studentId, academicYear, term" });
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { class: true } });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const existingStatement = await prisma.studentFeeStatement.findUnique({ where: { studentId_academicYear_term: { studentId, academicYear, term } } });
    if (existingStatement) return res.status(409).json({ message: `Fee statement already exists for ${student.fullName} in ${academicYear} ${term}` });
    const classFeesForTerm = await prisma.classFee.findMany({ where: { classId: student.classId, term: term } });
    const currentTermFee = classFeesForTerm.reduce((sum, fee) => sum + fee.amount, 0);
    let previousBalance = 0;
    const termMap = { term1: 0, term2: 1, term3: 2 };
    const currentTermIndex = termMap[term] || 0;
    if (currentTermIndex > 0) {
      const prevTermKey = Object.keys(termMap).find((key) => termMap[key] === currentTermIndex - 1);
      if (prevTermKey) {
        const prevStatement = await prisma.studentFeeStatement.findFirst({ where: { studentId, term: prevTermKey }, orderBy: { createdAt: "desc" } });
        if (prevStatement) previousBalance = Math.max(0, prevStatement.balanceAmount);
      }
    } else {
      const prevYearStatements = await prisma.studentFeeStatement.findMany({ where: { studentId, academicYear: { lt: academicYear }, balanceAmount: { gt: 0 } }, orderBy: { academicYear: "desc" } });
      previousBalance = prevYearStatements.reduce((sum, stmt) => sum + stmt.balanceAmount, 0);
    }
    let termStartDateValue = termStartDate, termEndDateValue = termEndDate, dueDateValue = dueDate;
    if (!termStartDateValue || !termEndDateValue) {
      const termDates = await prisma.termDates.findFirst({ where: { academicYear, term } });
      if (termDates) {
        termStartDateValue = termDates.startDate;
        termEndDateValue = termDates.endDate;
        dueDateValue = termDates.endDate;
      } else {
        termStartDateValue = new Date();
        termEndDateValue = new Date();
        dueDateValue = new Date();
      }
    }
    const totalPayable = previousBalance + currentTermFee;
    const statement = await prisma.studentFeeStatement.create({
      data: { studentId, academicYear, term, studentClassName: student.class?.className || null, currentTermFee, previousBalance, totalPayable, amountPaid: 0, balanceAmount: totalPayable, status: "pending", termStartDate: new Date(termStartDateValue), termEndDate: new Date(termEndDateValue), dueDate: new Date(dueDateValue) },
      include: { student: { include: { class: true } }, feePayments: true },
    });
    res.status(201).json(statement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStudentFeeStatement = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, balanceAmount, status } = req.body;
    if (!id || id === "undefined") return res.status(400).json({ message: "Fee statement ID is required" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid fee statement ID format" });
    const statementExists = await prisma.studentFeeStatement.findUnique({ where: { id } });
    if (!statementExists) return res.status(404).json({ message: "Fee statement not found" });
    const updatedStatement = await prisma.studentFeeStatement.update({
      where: { id },
      data: { amountPaid: amountPaid !== undefined ? amountPaid : undefined, balanceAmount: balanceAmount !== undefined ? balanceAmount : undefined, status: status || undefined },
      include: { student: { include: { class: true } }, feePayments: { include: { classFee: true, createdBy: true, receipts: true }, orderBy: { createdAt: "desc" } } },
    });
    res.status(200).json(updatedStatement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudentFeeStatement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ message: "Fee statement ID is required" });
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid fee statement ID format" });
    const statementExists = await prisma.studentFeeStatement.findUnique({ where: { id }, include: { feePayments: true } });
    if (!statementExists) return res.status(404).json({ message: "Fee statement not found" });
    if (statementExists.feePayments.length > 0) return res.status(400).json({ message: "Cannot delete statement with payments. Please delete payments first." });
    await prisma.studentFeeStatement.delete({ where: { id } });
    res.status(200).json({ message: "Fee statement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentFeeSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId || studentId === "undefined") return res.status(400).json({ message: "Student ID is required" });
    if (!studentId.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid student ID format" });
    const statements = await prisma.studentFeeStatement.findMany({ where: { studentId }, include: { feePayments: { select: { amount: true, status: true } } } });
    const summary = {
      studentId,
      totalStatements: statements.length,
      totalPayable: statements.reduce((sum, s) => sum + s.totalPayable, 0),
      totalPaid: statements.reduce((sum, s) => sum + s.amountPaid, 0),
      totalBalance: statements.reduce((sum, s) => sum + s.balanceAmount, 0),
      completedTerms: statements.filter((s) => s.status === "completed").length,
      pendingTerms: statements.filter((s) => s.status === "pending").length,
      statements,
    };
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkCreateFeeStatements = async (req, res) => {
  try {
    const { classId, academicYear, term, termStartDate, termEndDate, dueDate } = req.body;
    if (!classId || !academicYear || !term) return res.status(400).json({ message: "Missing required fields: classId, academicYear, term, termStartDate, termEndDate, dueDate" });
    const classExists = await prisma.class.findUnique({ where: { id: classId }, include: { students: true } });
    if (!classExists) return res.status(404).json({ message: "Class not found" });
    const classFeesForTerm = await prisma.classFee.findMany({ where: { classId: classId, term: term } });
    const currentTermFee = classFeesForTerm.reduce((sum, fee) => sum + fee.amount, 0);
    const createdStatements = [];
    const errors = [];
    for (const student of classExists.students) {
      try {
        const existingStatement = await prisma.studentFeeStatement.findUnique({ where: { studentId_academicYear_term: { studentId: student.id, academicYear, term } } });
        if (existingStatement) { errors.push({ studentId: student.id, studentName: student.fullName, error: "Statement already exists for this term" }); continue; }
        let previousBalance = 0;
        const termMap = { term1: 0, term2: 1, term3: 2 };
        const currentTermIndex = termMap[term] || 0;
        if (currentTermIndex > 0) {
          const prevTermKey = Object.keys(termMap).find((key) => termMap[key] === currentTermIndex - 1);
          if (prevTermKey) {
            const prevStatement = await prisma.studentFeeStatement.findFirst({ where: { studentId: student.id, term: prevTermKey }, orderBy: { createdAt: "desc" } });
            if (prevStatement) previousBalance = Math.max(0, prevStatement.balanceAmount);
          }
        }
        let termStartDateValue = termStartDate, termEndDateValue = termEndDate, dueDateValue = dueDate;
        if (!termStartDateValue || !termEndDateValue) {
          const termDates = await prisma.termDates.findFirst({ where: { academicYear, term } });
          if (termDates) {
            termStartDateValue = termDates.startDate;
            termEndDateValue = termDates.endDate;
            dueDateValue = termDates.endDate;
          } else {
            termStartDateValue = new Date();
            termEndDateValue = new Date();
            dueDateValue = new Date();
          }
        }
        const totalPayable = previousBalance + currentTermFee;
        const statement = await prisma.studentFeeStatement.create({
          data: { studentId: student.id, academicYear, term, studentClassName: classExists.className, currentTermFee, previousBalance, totalPayable, amountPaid: 0, balanceAmount: totalPayable, status: "pending", termStartDate: new Date(termStartDateValue), termEndDate: new Date(termEndDateValue), dueDate: new Date(dueDateValue) },
        });
        createdStatements.push({ studentId: student.id, studentName: student.fullName, statementId: statement.id, totalPayable: statement.totalPayable });
      } catch (error) {
        errors.push({ studentId: student.id, studentName: student.fullName, error: error.message });
      }
    }
    res.status(201).json({ message: `Created ${createdStatements.length} statements, ${errors.length} errors`, createdStatements, errors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
