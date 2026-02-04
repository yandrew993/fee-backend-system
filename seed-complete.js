import prisma from "./lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Starting comprehensive database seeding...\n");

  try {
    // Clean up existing data (optional - comment out to keep data)
    // console.log("🗑️  Clearing existing data...");
    // await prisma.receipt.deleteMany({});
    // await prisma.feePayment.deleteMany({});
    // await prisma.studentFeeStatement.deleteMany({});
    // await prisma.student.deleteMany({});
    // await prisma.classFee.deleteMany({});
    // await prisma.class.deleteMany({});
    // await prisma.user.deleteMany({});
    // await prisma.academicTerm.deleteMany({});

    // 1. Create Academic Terms
    console.log("📅 Creating Academic Terms...");
    const academicTerm2024 = await prisma.academicTerm.upsert({
      where: { academicYear: "2024-2025" },
      update: {},
      create: {
        academicYear: "2024-2025",
        term1Name: "Term 1",
        term1StartDate: new Date("2024-01-15"),
        term1EndDate: new Date("2024-04-15"),
        term1Duration: 4,
        term2Name: "Term 2",
        term2StartDate: new Date("2024-05-15"),
        term2EndDate: new Date("2024-08-15"),
        term2Duration: 4,
        term3Name: "Term 3",
        term3StartDate: new Date("2024-09-01"),
        term3EndDate: new Date("2024-11-30"),
        term3Duration: 3,
        isActive: true,
      },
    });
    console.log(`✅ Created Academic Term: ${academicTerm2024.academicYear}\n`);

    // 2. Create Users (Admin and Accountants)
    console.log("👥 Creating Users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const admin = await prisma.user.upsert({
      where: { email: "admin@school.com" },
      update: {},
      create: {
        email: "admin@school.com",
        username: "admin",
        password: hashedPassword,
        fullName: "System Administrator",
        phone: "+1234567890",
        role: "admin",
      },
    });
    console.log(`✅ Created Admin: ${admin.fullName}`);

    const accountant1 = await prisma.user.upsert({
      where: { email: "accountant1@school.com" },
      update: {},
      create: {
        email: "accountant1@school.com",
        username: "accountant1",
        password: hashedPassword,
        fullName: "John Accountant",
        phone: "+1234567891",
        role: "accountant",
      },
    });
    console.log(`✅ Created Accountant: ${accountant1.fullName}`);

    const accountant2 = await prisma.user.upsert({
      where: { email: "accountant2@school.com" },
      update: {},
      create: {
        email: "accountant2@school.com",
        username: "accountant2",
        password: hashedPassword,
        fullName: "Jane Accountant",
        phone: "+1234567892",
        role: "accountant",
      },
    });
    console.log(`✅ Created Accountant: ${accountant2.fullName}\n`);

    // 3. Create Classes
    console.log("🏫 Creating Classes...");
    const classFormOneA = await prisma.class.upsert({
      where: { className: "Form 1A" },
      update: {},
      create: {
        className: "Form 1A",
        description: "First form students - Stream A",
      },
    });
    console.log(`✅ Created Class: ${classFormOneA.className}`);

    const classFormOneB = await prisma.class.upsert({
      where: { className: "Form 1B" },
      update: {},
      create: {
        className: "Form 1B",
        description: "First form students - Stream B",
      },
    });
    console.log(`✅ Created Class: ${classFormOneB.className}`);

    const classFormTwoA = await prisma.class.upsert({
      where: { className: "Form 2A" },
      update: {},
      create: {
        className: "Form 2A",
        description: "Second form students - Stream A",
      },
    });
    console.log(`✅ Created Class: ${classFormTwoA.className}\n`);

    // 4. Create Class Fees
    console.log("💰 Creating Class Fees...");
    
    // Form 1A - Term 1
    const classFeeForm1AT1Tuition = await prisma.classFee.upsert({
      where: {
        classId_name_term: {
          classId: classFormOneA.id,
          name: "Tuition",
          term: "term1",
        },
      },
      update: {},
      create: {
        name: "Tuition",
        classId: classFormOneA.id,
        className: classFormOneA.className,
        term: "term1",
        amount: 5000,
        termStartDate: new Date("2024-01-15"),
        termEndDate: new Date("2024-04-15"),
        dueDate: new Date("2024-02-15"),
        description: "Monthly tuition fee for Term 1",
        isRecurring: true,
      },
    });
    console.log(`✅ Created Fee: ${classFeeForm1AT1Tuition.name} - ${classFeeForm1AT1Tuition.amount}`);

    const classFeeForm1AT1Lab = await prisma.classFee.upsert({
      where: {
        classId_name_term: {
          classId: classFormOneA.id,
          name: "Lab Fee",
          term: "term1",
        },
      },
      update: {},
      create: {
        name: "Lab Fee",
        classId: classFormOneA.id,
        className: classFormOneA.className,
        term: "term1",
        amount: 500,
        termStartDate: new Date("2024-01-15"),
        termEndDate: new Date("2024-04-15"),
        dueDate: new Date("2024-02-15"),
        description: "Laboratory fee for practical sessions",
        isRecurring: true,
      },
    });
    console.log(`✅ Created Fee: ${classFeeForm1AT1Lab.name} - ${classFeeForm1AT1Lab.amount}`);

    const classFeeForm1AT1Sports = await prisma.classFee.upsert({
      where: {
        classId_name_term: {
          classId: classFormOneA.id,
          name: "Sports Fee",
          term: "term1",
        },
      },
      update: {},
      create: {
        name: "Sports Fee",
        classId: classFormOneA.id,
        className: classFormOneA.className,
        term: "term1",
        amount: 200,
        termStartDate: new Date("2024-01-15"),
        termEndDate: new Date("2024-04-15"),
        dueDate: new Date("2024-02-15"),
        description: "Sports and activities fee",
        isRecurring: true,
      },
    });
    console.log(`✅ Created Fee: ${classFeeForm1AT1Sports.name} - ${classFeeForm1AT1Sports.amount}\n`);

    // 5. Create Students
    console.log("📚 Creating Students...");
    
    const students = [];
    const studentData = [
      { admissionNumber: "ADM001", fullName: "John Peter Smith", gender: "M", parentName: "Peter Smith", parentPhone: "+1234567890" },
      { admissionNumber: "ADM002", fullName: "Jane Mary Johnson", gender: "F", parentName: "Mary Johnson", parentPhone: "+1234567891" },
      { admissionNumber: "ADM003", fullName: "Michael James Brown", gender: "M", parentName: "James Brown", parentPhone: "+1234567892" },
      { admissionNumber: "ADM004", fullName: "Sarah Elizabeth Davis", gender: "F", parentName: "Elizabeth Davis", parentPhone: "+1234567893" },
      { admissionNumber: "ADM005", fullName: "David Christopher Wilson", gender: "M", parentName: "Christopher Wilson", parentPhone: "+1234567894" },
    ];

    for (const data of studentData) {
      const student = await prisma.student.upsert({
        where: { admissionNumber: data.admissionNumber },
        update: {},
        create: {
          ...data,
          classId: classFormOneA.id,
          status: "active",
        },
      });
      students.push(student);
      console.log(`✅ Created Student: ${student.fullName} (${student.admissionNumber})`);
    }
    console.log();

    // 6. Create Student Fee Statements
    console.log("📋 Creating Student Fee Statements...");
    
    const statements = [];
    for (const student of students) {
      const statement = await prisma.studentFeeStatement.upsert({
        where: {
          studentId_academicYear_term: {
            studentId: student.id,
            academicYear: "2024-2025",
            term: "term1",
          },
        },
        update: {},
        create: {
          studentId: student.id,
          academicYear: "2024-2025",
          term: "term1",
          currentTermFee: 5700, // Tuition (5000) + Lab (500) + Sports (200)
          previousBalance: 0,
          totalPayable: 5700,
          amountPaid: 0,
          balanceAmount: 5700,
          status: "pending",
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
        },
      });
      statements.push(statement);
      console.log(`✅ Created Fee Statement for: ${student.fullName}`);
    }
    console.log();

    // 7. Create Fee Payments (Some students pay partial, some pay full)
    console.log("💳 Creating Fee Payments...");
    
    // Student 1: Partial payment
    const payment1 = await prisma.feePayment.create({
      data: {
        referenceNumber: `FP-${Date.now()}-001`,
        studentId: students[0].id,
        studentFeeStatementId: statements[0].id,
        classFeeId: classFeeForm1AT1Tuition.id,
        amount: 3000,
        paymentMethod: "cash",
        status: "completed",
        createdById: accountant1.id,
        notes: "First installment payment",
      },
    });
    console.log(`✅ Payment 1: ${students[0].fullName} paid ${payment1.amount}`);

    // Update statement 1 balance
    await prisma.studentFeeStatement.update({
      where: { id: statements[0].id },
      data: {
        amountPaid: 3000,
        balanceAmount: 2700,
        status: "pending",
      },
    });

    // Student 2: Full payment
    const payment2 = await prisma.feePayment.create({
      data: {
        referenceNumber: `FP-${Date.now()}-002`,
        studentId: students[1].id,
        studentFeeStatementId: statements[1].id,
        classFeeId: classFeeForm1AT1Tuition.id,
        amount: 5700,
        paymentMethod: "bank_transfer",
        status: "completed",
        createdById: accountant2.id,
        notes: "Full payment for term 1",
      },
    });
    console.log(`✅ Payment 2: ${students[1].fullName} paid ${payment2.amount}`);

    // Update statement 2 balance
    await prisma.studentFeeStatement.update({
      where: { id: statements[1].id },
      data: {
        amountPaid: 5700,
        balanceAmount: 0,
        status: "completed",
      },
    });

    // Student 3: Cheque payment (partial)
    const payment3 = await prisma.feePayment.create({
      data: {
        referenceNumber: `FP-${Date.now()}-003`,
        studentId: students[2].id,
        studentFeeStatementId: statements[2].id,
        classFeeId: classFeeForm1AT1Tuition.id,
        amount: 4000,
        paymentMethod: "cheque",
        status: "completed",
        createdById: accountant1.id,
        notes: "Payment via cheque",
      },
    });
    console.log(`✅ Payment 3: ${students[2].fullName} paid ${payment3.amount}`);

    // Update statement 3 balance
    await prisma.studentFeeStatement.update({
      where: { id: statements[2].id },
      data: {
        amountPaid: 4000,
        balanceAmount: 1700,
        status: "pending",
      },
    });

    console.log();

    // 8. Create Receipts
    console.log("🧾 Creating Receipts...");
    
    const receipt1 = await prisma.receipt.create({
      data: {
        receiptNumber: `RCP-2024-001`,
        studentId: students[0].id,
        feePaymentId: payment1.id,
        amount: 3000,
        paymentMethod: "cash",
        description: "Receipt for term 1 payment",
      },
    });
    console.log(`✅ Receipt 1: ${receipt1.receiptNumber} for ${students[0].fullName}`);

    const receipt2 = await prisma.receipt.create({
      data: {
        receiptNumber: `RCP-2024-002`,
        studentId: students[1].id,
        feePaymentId: payment2.id,
        amount: 5700,
        paymentMethod: "bank_transfer",
        description: "Receipt for full term 1 payment",
      },
    });
    console.log(`✅ Receipt 2: ${receipt2.receiptNumber} for ${students[1].fullName}`);

    const receipt3 = await prisma.receipt.create({
      data: {
        receiptNumber: `RCP-2024-003`,
        studentId: students[2].id,
        feePaymentId: payment3.id,
        amount: 4000,
        paymentMethod: "cheque",
        description: "Receipt for cheque payment",
      },
    });
    console.log(`✅ Receipt 3: ${receipt3.receiptNumber} for ${students[2].fullName}`);

    console.log("\n✨ Database seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Academic Terms: 1`);
    console.log(`   - Users: 3`);
    console.log(`   - Classes: 3`);
    console.log(`   - Class Fees: 3`);
    console.log(`   - Students: 5`);
    console.log(`   - Fee Statements: 5`);
    console.log(`   - Payments: 3`);
    console.log(`   - Receipts: 3`);
    console.log("\n🚀 Ready to test API endpoints!\n");

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
