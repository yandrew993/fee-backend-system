import prisma from "../lib/prisma.js";

// Get overall fee collection report
export const getOverallReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const payments = await prisma.feePayment.findMany({
      where: filter,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        classFee: true,
        receipts: true,
      },
    });

    const report = {
      period: {
        startDate: startDate || "All Time",
        endDate: endDate || "All Time",
      },
      summary: {
        totalPayments: payments.length,
        totalAmount: 0,
        totalCollected: 0,
        totalPending: 0,
        totalFailed: 0,
        totalCancelled: 0,
      },
      byStatus: {
        pending: [],
        completed: [],
        failed: [],
        cancelled: [],
      },
      byClass: {},
      byPaymentMethod: {},
      details: [],
    };

    payments.forEach((payment) => {
      // Update summary
      report.summary.totalAmount += payment.amount;
      report.summary.totalCollected += payment.amountPaid;
      report.summary.totalPending +=
        payment.status === "pending" ? payment.balanceAmount : 0;

      if (payment.status === "failed") report.summary.totalFailed += payment.amount;
      if (payment.status === "cancelled")
        report.summary.totalCancelled += payment.amount;

      // By status
      report.byStatus[payment.status].push({
        referenceNumber: payment.referenceNumber,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        amount: payment.amount,
        collected: payment.amountPaid,
        balance: payment.balanceAmount,
      });

      // By class
      const className = payment.student.class.name;
      if (!report.byClass[className]) {
        report.byClass[className] = {
          totalAmount: 0,
          totalCollected: 0,
          count: 0,
        };
      }
      report.byClass[className].totalAmount += payment.amount;
      report.byClass[className].totalCollected += payment.amountPaid;
      report.byClass[className].count += 1;

      // By payment method
      payment.receipts.forEach((receipt) => {
        const method = receipt.paymentMethod;
        if (!report.byPaymentMethod[method]) {
          report.byPaymentMethod[method] = {
            count: 0,
            amount: 0,
          };
        }
        report.byPaymentMethod[method].count += 1;
        report.byPaymentMethod[method].amount += receipt.amount;
      });

      // Details
      report.details.push({
        referenceNumber: payment.referenceNumber,
        studentAdmission: payment.student.admissionNumber,
        studentName: `${payment.student.firstName} ${payment.student.lastName}`,
        className: className,
        feeName: payment.classFee.name,
        amount: payment.amount,
        amountPaid: payment.amountPaid,
        balance: payment.balanceAmount,
        status: payment.status,
        dueDate: payment.dueDate,
        receipts: payment.receipts.length,
      });
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get class-wise fee report
export const getClassReport = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          include: {
            feePayments: {
              include: {
                classFee: true,
                receipts: true,
              },
            },
          },
        },
        classFees: {
          include: {
            feePayments: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const report = {
      class: {
        id: classData.id,
        name: classData.name,
        level: classData.level,
        studentCount: classData.students.length,
      },
      summary: {
        totalFees: 0,
        totalCollected: 0,
        totalPending: 0,
      },
      studentDetails: [],
      feeSummary: [],
    };

    // Build student details
    classData.students.forEach((student) => {
      const studentReport = {
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        totalDue: 0,
        totalPaid: 0,
        balance: 0,
        fees: [],
        status: student.status,
      };

      student.feePayments.forEach((payment) => {
        studentReport.totalDue += payment.amount;
        studentReport.totalPaid += payment.amountPaid;
        studentReport.balance += payment.balanceAmount;

        studentReport.fees.push({
          feeName: payment.classFee.name,
          amount: payment.amount,
          paid: payment.amountPaid,
          balance: payment.balanceAmount,
          status: payment.status,
          receipts: payment.receipts.length,
        });
      });

      report.studentDetails.push(studentReport);
      report.summary.totalFees += studentReport.totalDue;
      report.summary.totalCollected += studentReport.totalPaid;
      report.summary.totalPending += studentReport.balance;
    });

    // Build fee summary
    classData.classFees.forEach((classFee) => {
      const totalAmount = classFee.feePayments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const totalCollected = classFee.feePayments.reduce(
        (sum, p) => sum + p.amountPaid,
        0
      );
      const pendingCount = classFee.feePayments.filter(
        (p) => p.status === "pending"
      ).length;
      const completedCount = classFee.feePayments.filter(
        (p) => p.status === "completed"
      ).length;

      report.feeSummary.push({
        feeName: classFee.name,
        amount: classFee.amount,
        totalAmount,
        totalCollected,
        balance: totalAmount - totalCollected,
        pendingCount,
        completedCount,
      });
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student fee report
export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        feePayments: {
          include: {
            classFee: true,
            receipts: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const report = {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        class: student.class.name,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        status: student.status,
      },
      summary: {
        totalFees: 0,
        totalPaid: 0,
        totalBalance: 0,
        pendingCount: 0,
        completedCount: 0,
      },
      fees: [],
      paymentHistory: [],
    };

    // Calculate summary and build fee details
    student.feePayments.forEach((payment) => {
      report.summary.totalFees += payment.amount;
      report.summary.totalPaid += payment.amountPaid;
      report.summary.totalBalance += payment.balanceAmount;

      if (payment.status === "pending") report.summary.pendingCount += 1;
      if (payment.status === "completed") report.summary.completedCount += 1;

      report.fees.push({
        referenceNumber: payment.referenceNumber,
        feeName: payment.classFee.name,
        feeAmount: payment.classFee.amount,
        totalAmount: payment.amount,
        amountPaid: payment.amountPaid,
        balance: payment.balanceAmount,
        status: payment.status,
        dueDate: payment.dueDate,
        createdDate: payment.createdAt,
      });

      // Build payment history from receipts
      payment.receipts.forEach((receipt) => {
        report.paymentHistory.push({
          receiptNumber: receipt.receiptNumber,
          feeName: payment.classFee.name,
          amount: receipt.amount,
          method: receipt.paymentMethod,
          date: receipt.paymentDate,
          description: receipt.description,
        });
      });
    });

    // Sort payment history by date
    report.paymentHistory.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending fees report
export const getPendingFeesReport = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = { status: "pending" };

    if (classId) {
      filter.student = { classId };
    }

    const pendingPayments = await prisma.feePayment.findMany({
      where: filter,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        classFee: true,
      },
      orderBy: { dueDate: "asc" },
    });

    const report = {
      title: "Pending Fees Report",
      generatedDate: new Date(),
      totalPendingFees: 0,
      totalStudentsWithPendingFees: new Set(),
      details: [],
    };

    // Group by student
    const studentMap = {};

    pendingPayments.forEach((payment) => {
      report.totalPendingFees += payment.balanceAmount;
      report.totalStudentsWithPendingFees.add(payment.studentId);

      if (!studentMap[payment.studentId]) {
        studentMap[payment.studentId] = {
          admissionNumber: payment.student.admissionNumber,
          studentName: `${payment.student.firstName} ${payment.student.lastName}`,
          className: payment.student.class.name,
          parentEmail: payment.student.parentEmail,
          parentPhone: payment.student.parentPhone,
          fees: [],
          totalBalance: 0,
        };
      }

      studentMap[payment.studentId].fees.push({
        feeName: payment.classFee.name,
        dueDate: payment.dueDate,
        amount: payment.balanceAmount,
      });

      studentMap[payment.studentId].totalBalance += payment.balanceAmount;
    });

    report.details = Object.values(studentMap);
    report.totalStudentsWithPendingFees = report.totalStudentsWithPendingFees.size;

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export report statistics
export const getReportStatistics = async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    const classes = await prisma.class.findMany();
    const payments = await prisma.feePayment.findMany();
    const receipts = await prisma.receipt.findMany();

    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.status === "active").length,
      totalClasses: classes.length,
      totalFeePayments: payments.length,
      totalReceipts: receipts.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCollected: receipts.reduce((sum, r) => sum + r.amount, 0),
      paymentCompletion: (
        (receipts.reduce((sum, r) => sum + r.amount, 0) /
          payments.reduce((sum, p) => sum + p.amount, 0)) *
        100
      ).toFixed(2),
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
