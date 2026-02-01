import prisma from "../lib/prisma.js";

// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        students: true,
        classFees: true,
      },
      orderBy: { className: "asc" },
    });

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single class
export const getClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            admissionNumber: true,
            fullName: true,
            status: true,
          },
        },
        classFees: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new class
export const createClass = async (req, res) => {
  try {
    const { className, description } = req.body;

    if (!className) {
      return res.status(400).json({ message: "className is required" });
    }

    // Check if class name already exists
    const existingClass = await prisma.class.findUnique({
      where: { className },
    });

    if (existingClass) {
      return res
        .status(400)
        .json({ message: "Class with this name already exists" });
    }

    const newClass = await prisma.class.create({
      data: {
        className,
        description: description || null,
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, description } = req.body;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id },
    });

    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // If name is being changed, check for uniqueness
    if (className && className !== classExists.className) {
      const nameExists = await prisma.class.findUnique({
        where: { className },
      });

      if (nameExists) {
        return res
          .status(400)
          .json({ message: "Class name already exists" });
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        className: className || undefined,
        description: description || undefined,
      },
    });

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id },
      include: { students: true },
    });

    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if there are students in this class
    if (classExists.students.length > 0) {
      return res
        .status(400)
        .json({
          message:
            "Cannot delete class with students. Please reassign or delete students first.",
        });
    }

    // Delete class (classFees will be cascaded)
    await prisma.class.delete({
      where: { id },
    });

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get class fee summary
export const getClassFeeSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is provided and not undefined
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          select: { id: true },
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

    const summary = {
      totalStudents: classData.students.length,
      totalFees: 0,
      totalCollected: 0,
      totalPending: 0,
      fees: [],
    };

    classData.classFees.forEach((fee) => {
      const totalAmount = fee.feePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPaid = fee.feePayments.reduce(
        (sum, p) => sum + p.amountPaid,
        0
      );
      const pending = totalAmount - totalPaid;

      summary.totalFees += totalAmount;
      summary.totalCollected += totalPaid;
      summary.totalPending += pending;

      summary.fees.push({
        id: fee.id,
        name: fee.name,
        amount: fee.amount,
        totalAmount,
        totalCollected: totalPaid,
        balance: pending,
      });
    });

    res.status(200).json({
      class: {
        id: classData.id,
        className: classData.className,
      },
      summary,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
