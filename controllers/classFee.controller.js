import prisma from "../lib/prisma.js";

// Get all class fees
export const getAllClassFees = async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = {};

    if (classId) filter.classId = classId;

    const fees = await prisma.classFee.findMany({
      where: filter,
      include: {
        class: true,
        feePayments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single class fee
export const getClassFee = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class fee ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class fee ID format" });
    }

    const fee = await prisma.classFee.findUnique({
      where: { id },
      include: {
        class: true,
        feePayments: {
          include: {
            student: true,
            receipts: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!fee) {
      return res.status(404).json({ message: "Fee not found" });
    }

    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new class fee
export const createClassFee = async (req, res) => {
  try {
    const { className, term, amount, classId } = req.body;

    // Validate required fields
    if (!className || !term || amount === undefined || !classId) {
      return res.status(400).json({
        message: "className, term, amount, and classId are required",
      });
    }

    // Validate term value
    const validTerms = ["term1", "term2", "term3"];
    if (!validTerms.includes(term)) {
      return res.status(400).json({
        message: "term must be one of: term1, term2, term3",
      });
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if fee already exists for this class and term
    const existingFee = await prisma.classFee.findUnique({
      where: {
        classId_term: {
          classId,
          term,
        },
      },
    });

    if (existingFee) {
      return res.status(400).json({
        message: `Fee for ${className} - ${term} already exists. Please update instead of creating a new one.`,
      });
    }

    const classFee = await prisma.classFee.create({
      data: {
        className,
        term,
        amount: parseFloat(amount),
        classId,
      },
      include: {
        class: true,
      },
    });

    res.status(201).json(classFee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update class fee
export const updateClassFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, term, amount } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class fee ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class fee ID format" });
    }

    // Verify fee exists
    const feeExists = await prisma.classFee.findUnique({
      where: { id },
    });

    if (!feeExists) {
      return res.status(404).json({ message: "Fee not found" });
    }

    // Validate term if provided
    if (term) {
      const validTerms = ["term1", "term2", "term3"];
      if (!validTerms.includes(term)) {
        return res.status(400).json({
          message: "term must be one of: term1, term2, term3",
        });
      }
    }

    // Check for duplicate if changing term
    if (term && term !== feeExists.term) {
      const existingFee = await prisma.classFee.findUnique({
        where: {
          classId_term: {
            classId: feeExists.classId,
            term,
          },
        },
      });

      if (existingFee) {
        return res.status(400).json({
          message: `Fee for this class with ${term} already exists`,
        });
      }
    }

    const updatedFee = await prisma.classFee.update({
      where: { id },
      data: {
        className: className || undefined,
        term: term || undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
      },
      include: {
        class: true,
      },
    });

    res.status(200).json(updatedFee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete class fee
export const deleteClassFee = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class fee ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class fee ID format" });
    }

    // Verify fee exists
    const feeExists = await prisma.classFee.findUnique({
      where: { id },
      include: { feePayments: true },
    });

    if (!feeExists) {
      return res.status(404).json({ message: "Fee not found" });
    }

    // Check if there are payments for this fee
    if (feeExists.feePayments.length > 0) {
      return res
        .status(400)
        .json({
          message:
            "Cannot delete fee with existing payments. Please delete payments first.",
        });
    }

    // Delete fee
    await prisma.classFee.delete({
      where: { id },
    });

    res.status(200).json({ message: "Fee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
