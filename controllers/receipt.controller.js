import prisma from "../lib/prisma.js";

// Get all receipts
export const getAllReceipts = async (req, res) => {
  try {
    const { studentId, feePaymentId } = req.query;
    const filter = {};

    if (studentId) filter.studentId = studentId;
    if (feePaymentId) filter.feePaymentId = feePaymentId;

    const receipts = await prisma.receipt.findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        feePayment: {
          include: {
            classFee: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single receipt
export const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Receipt ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid receipt ID format" });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        feePayment: {
          include: {
            classFee: true,
            createdBy: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create receipt
export const createReceipt = async (req, res) => {
  try {
    const { studentId, feePaymentId, amount, paymentMethod, paymentDate, description } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify fee payment exists
    const feePayment = await prisma.feePayment.findUnique({
      where: { id: feePaymentId },
    });

    if (!feePayment) {
      return res.status(404).json({ message: "Fee payment not found" });
    }

    // Generate receipt number
    const lastReceipt = await prisma.receipt.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const receiptNumber = `RCP-${String((lastReceipt ? parseInt(lastReceipt.receiptNumber.split("-")[1]) + 1 : 1).toString().padStart(6, "0"))}`;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        studentId,
        feePaymentId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        description: description || null,
      },
      include: {
        student: true,
        feePayment: {
          include: {
            classFee: true,
          },
        },
      },
    });

    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update receipt
export const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, description } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Receipt ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid receipt ID format" });
    }

    // Verify receipt exists
    const receiptExists = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receiptExists) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        paymentMethod: paymentMethod || undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        description: description || undefined,
      },
      include: {
        student: true,
        feePayment: {
          include: {
            classFee: true,
          },
        },
      },
    });

    res.status(200).json(updatedReceipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete receipt
export const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Receipt ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid receipt ID format" });
    }

    // Verify receipt exists
    const receiptExists = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receiptExists) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Delete receipt
    await prisma.receipt.delete({
      where: { id },
    });

    res.status(200).json({ message: "Receipt deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get receipt PDF data
export const getReceiptData = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Receipt ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid receipt ID format" });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        feePayment: {
          include: {
            classFee: true,
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Format data for PDF generation
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      date: receipt.createdAt,
      student: {
        name: `${receipt.student.firstName} ${receipt.student.lastName}`,
        admissionNumber: receipt.student.admissionNumber,
        class: receipt.student.class.name,
      },
      fee: {
        name: receipt.feePayment.classFee.name,
        amount: receipt.feePayment.amount,
      },
      payment: {
        amount: receipt.amount,
        method: receipt.paymentMethod,
        date: receipt.paymentDate,
      },
      schoolInfo: {
        name: process.env.SCHOOL_NAME || "Educational Institution",
        address: process.env.SCHOOL_ADDRESS || "",
        phone: process.env.SCHOOL_PHONE || "",
        email: process.env.SCHOOL_EMAIL || "",
      },
    };

    res.status(200).json(receiptData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
