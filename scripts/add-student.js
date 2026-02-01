import prisma from "../lib/prisma.js";

async function addStudent() {
  try {
    console.log("Adding a sample student to the database...");

    // First, get an existing class or create one
    let classData = await prisma.class.findFirst();

    if (!classData) {
      console.log("No classes found. Creating a sample class...");
      classData = await prisma.class.create({
        data: {
          name: "Form 1A",
          level: 1,
          capacity: 40,
          description: "First form class A",
        },
      });
      console.log("✅ Class created:", classData.name);
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber: "ADM-2024-001" },
    });

    if (existingStudent) {
      console.log("⚠️  Student with admission number ADM-2024-001 already exists");
      console.log("Existing student:", existingStudent);
      return;
    }

    // Create a new student
    const newStudent = await prisma.student.create({
      data: {
        admissionNumber: "ADM-2024-001",
        fullName: "Andrew Young",
        gender: "Male",
        parentName: "John Young",
        parentPhone: "+255 123 456 789",
        classId: classData.id,
      },
      include: {
        class: true,
      },
    });

    console.log("\n✅ Student added successfully!");
    console.log("Student Details:");
    console.log("  - ID:", newStudent.id);
    console.log("  - Admission Number:", newStudent.admissionNumber);
    console.log("  - Full Name:", newStudent.fullName);
    console.log("  - Gender:", newStudent.gender);
    console.log("  - Parent Name:", newStudent.parentName);
    console.log("  - Parent Phone:", newStudent.parentPhone);
    console.log("  - Class:", newStudent.class.name);
    console.log("  - Status:", newStudent.status);
    console.log("  - Created At:", newStudent.createdAt);
  } catch (error) {
    console.error("❌ Error adding student:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addStudent();
