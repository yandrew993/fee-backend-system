import prisma from "../lib/prisma.js";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await prisma.receipt.deleteMany({});
    await prisma.feePayment.deleteMany({});
    await prisma.studentFeeStatement.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.classFee.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.termDates.deleteMany({});
    console.log("✅ Data cleared\n");

    // ==================== SEED TERM DATES ====================
    console.log("📅 Seeding TermDates...");
    const now = new Date();
    const currentYear = now.getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const termDates = await prisma.termDates.createMany({
      data: [
        {
          academicYear,
          term: "term1",
          startDate: new Date(currentYear, 0, 15), // Jan 15
          endDate: new Date(currentYear, 4, 15), // May 15
          status: "active", // Will be computed based on current date
        },
        {
          academicYear,
          term: "term2",
          startDate: new Date(currentYear, 5, 1), // Jun 1
          endDate: new Date(currentYear, 8, 30), // Sep 30
          status: "inactive",
        },
        {
          academicYear,
          term: "term3",
          startDate: new Date(currentYear, 9, 1), // Oct 1
          endDate: new Date(currentYear, 11, 15), // Dec 15
          status: "inactive",
        },
      ],
    });
    console.log(`✅ Created ${termDates.count} term dates\n`);

    // ==================== SEED CLASSES ====================
    console.log("🏫 Seeding Classes...");
    const classes = await prisma.class.createMany({
      data: [
        {
          className: "Grade 1",
          description: "First grade students",
        },
        {
          className: "Grade 2",
          description: "Second grade students",
        },
        {
          className: "Grade 3",
          description: "Third grade students",
        },
        {
          className: "Form 1",
          description: "First form students",
        },
        {
          className: "Form 2",
          description: "Second form students",
        },
      ],
    });
    console.log(`✅ Created ${classes.count} classes\n`);

    // Get created classes for reference
    const createdClasses = await prisma.class.findMany();
    console.log(`📋 Found ${createdClasses.length} classes in database\n`);

    // ==================== SEED CLASS FEES ====================
    console.log("💰 Seeding ClassFees...");
    const classFees = await prisma.classFee.createMany({
      data: [
        {
          classId: createdClasses[0].id, // Grade 1
          className: "Grade 1",
          term: "term1",
          amount: 45000,
        },
        {
          classId: createdClasses[0].id, // Grade 1
          className: "Grade 1",
          term: "term2",
          amount: 45000,
        },
        {
          classId: createdClasses[0].id, // Grade 1
          className: "Grade 1",
          term: "term3",
          amount: 40000,
        },
        {
          classId: createdClasses[1].id, // Grade 2
          className: "Grade 2",
          term: "term1",
          amount: 50000,
        },
        {
          classId: createdClasses[1].id, // Grade 2
          className: "Grade 2",
          term: "term2",
          amount: 50000,
        },
        {
          classId: createdClasses[1].id, // Grade 2
          className: "Grade 2",
          term: "term3",
          amount: 45000,
        },
        {
          classId: createdClasses[2].id, // Grade 3
          className: "Grade 3",
          term: "term1",
          amount: 55000,
        },
        {
          classId: createdClasses[2].id, // Grade 3
          className: "Grade 3",
          term: "term2",
          amount: 55000,
        },
        {
          classId: createdClasses[2].id, // Grade 3
          className: "Grade 3",
          term: "term3",
          amount: 50000,
        },
        {
          classId: createdClasses[3].id, // Form 1
          className: "Form 1",
          term: "term1",
          amount: 65000,
        },
        {
          classId: createdClasses[3].id, // Form 1
          className: "Form 1",
          term: "term2",
          amount: 65000,
        },
        {
          classId: createdClasses[3].id, // Form 1
          className: "Form 1",
          term: "term3",
          amount: 60000,
        },
        {
          classId: createdClasses[4].id, // Form 2
          className: "Form 2",
          term: "term1",
          amount: 75000,
        },
        {
          classId: createdClasses[4].id, // Form 2
          className: "Form 2",
          term: "term2",
          amount: 75000,
        },
        {
          classId: createdClasses[4].id, // Form 2
          className: "Form 2",
          term: "term3",
          amount: 70000,
        },
      ],
    });
    console.log(`✅ Created ${classFees.count} class fees\n`);

    // ==================== SEED STUDENTS ====================
    console.log("👥 Seeding Students...");
    const studentNames = [
      { fullName: "Andrew Young", gender: "Male", parentName: "John Young", parentPhone: "0712345001" },
      { fullName: "Sarah Johnson", gender: "Female", parentName: "Mary Johnson", parentPhone: "0712345002" },
      { fullName: "Michael Brown", gender: "Male", parentName: "David Brown", parentPhone: "0712345003" },
      { fullName: "Emily Davis", gender: "Female", parentName: "Lisa Davis", parentPhone: "0712345004" },
      { fullName: "James Wilson", gender: "Male", parentName: "Robert Wilson", parentPhone: "0712345005" },
      { fullName: "Jessica Miller", gender: "Female", parentName: "Patricia Miller", parentPhone: "0712345006" },
      { fullName: "Daniel Taylor", gender: "Male", parentName: "Richard Taylor", parentPhone: "0712345007" },
      { fullName: "Lisa Anderson", gender: "Female", parentName: "Jennifer Anderson", parentPhone: "0712345008" },
      { fullName: "Christopher Moore", gender: "Male", parentName: "Thomas Moore", parentPhone: "0712345009" },
      { fullName: "Amanda Jackson", gender: "Female", parentName: "Barbara Jackson", parentPhone: "0712345010" },
    ];

    const students = await prisma.student.createMany({
      data: studentNames.map((student, index) => ({
        admissionNumber: `ADM-2024-${String(index + 1).padStart(3, "0")}`,
        fullName: student.fullName,
        gender: student.gender,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        status: "active",
        classId: createdClasses[index % createdClasses.length].id,
      })),
    });
    console.log(`✅ Created ${students.count} students\n`);

    // Get created students
    const createdStudents = await prisma.student.findMany({
      include: { class: true },
    });
    console.log(`📋 Found ${createdStudents.length} students in database\n`);

    // ==================== SEED FEE STATEMENTS ====================
    console.log("📊 Seeding StudentFeeStatements...");
    const term1 = await prisma.termDates.findUnique({
      where: { academicYear_term: { academicYear, term: "term1" } },
    });

    const feeStatements = [];
    for (const student of createdStudents) {
      const studentClass = student.class;
      const classFee = await prisma.classFee.findUnique({
        where: {
          classId_term: {
            classId: student.classId,
            term: "term1",
          },
        },
      });

      if (classFee && term1) {
        feeStatements.push({
          studentId: student.id,
          academicYear,
          term: "term1",
          currentTermFee: classFee.amount,
          previousBalance: 0, // New students have 0 previous balance
          totalPayable: classFee.amount,
          amountPaid: 0,
          balanceAmount: classFee.amount,
          status: "pending",
          termStartDate: term1.startDate,
          termEndDate: term1.endDate,
          dueDate: new Date(term1.endDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before end
          notes: `Fee statement for ${studentClass.className} - Term 1`,
        });
      }
    }

    if (feeStatements.length > 0) {
      const createdStatements = await prisma.studentFeeStatement.createMany({
        data: feeStatements,
      });
      console.log(`✅ Created ${createdStatements.count} fee statements\n`);
    }

    // ==================== SEED FEE PAYMENTS ====================
    console.log("💳 Seeding FeePayments...");
    const feeStatementList = await prisma.studentFeeStatement.findMany();

    const feePayments = [];
    let paymentCounter = 1;

    for (let i = 0; i < feeStatementList.length; i++) {
      const statement = feeStatementList[i];
      const hasPayment = Math.random() > 0.4; // 60% of students have made some payment

      if (hasPayment) {
        const paymentAmount = statement.totalPayable * (0.4 + Math.random() * 0.5); // 40-90% of total

        // Find the admin user for createdBy
        const adminUser = await prisma.user.findFirst({
          where: { role: "admin" },
        });

        if (adminUser) {
          feePayments.push({
            referenceNumber: `PAY-${String(paymentCounter).padStart(5, "0")}`,
            studentId: statement.studentId,
            studentFeeStatementId: statement.id,
            amount: paymentAmount,
            paymentMethod: ["cash", "cheque", "bank_transfer", "mobile_money"][
              Math.floor(Math.random() * 4)
            ],
            paymentDate: new Date(
              statement.termStartDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
            ),
            status: "completed",
            createdById: adminUser.id,
            notes: `Payment for ${statement.academicYear} - ${statement.term}`,
          });
          paymentCounter++;
        }
      }
    }

    if (feePayments.length > 0) {
      const createdPayments = await prisma.feePayment.createMany({
        data: feePayments,
      });
      console.log(`✅ Created ${createdPayments.count} fee payments\n`);
    }

    // ==================== SEED RECEIPTS ====================
    console.log("🧾 Seeding Receipts...");
    const paymentList = await prisma.feePayment.findMany();

    const receipts = paymentList.map((payment, index) => ({
      receiptNumber: `REC-${String(index + 1).padStart(5, "0")}`,
      studentId: payment.studentId,
      feePaymentId: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      description: `Receipt for payment ${payment.referenceNumber}`,
    }));

    if (receipts.length > 0) {
      const createdReceipts = await prisma.receipt.createMany({
        data: receipts,
      });
      console.log(`✅ Created ${createdReceipts.count} receipts\n`);
    }

    // ==================== SUMMARY ====================
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════════════════\n");

    console.log("📊 SEEDING SUMMARY:");
    console.log(`  • TermDates:        ${termDates.count}`);
    console.log(`  • Classes:          ${classes.count}`);
    console.log(`  • ClassFees:        ${classFees.count}`);
    console.log(`  • Students:         ${students.count}`);
    console.log(`  • FeeStatements:    ${feeStatementList.length}`);
    console.log(`  • FeePayments:      ${feePayments.length}`);
    console.log(`  • Receipts:         ${receipts.length}`);
    console.log("\n🎓 Students Created:");
    createdStudents.forEach((student, index) => {
      console.log(
        `  ${index + 1}. ${student.admissionNumber} - ${student.fullName} (${student.class.className})`
      );
    });
    console.log("\n📅 Terms Created:");
    const allTerms = await prisma.termDates.findMany();
    allTerms.forEach((term) => {
      console.log(
        `  • ${term.academicYear} - ${term.term.toUpperCase()}: ${term.startDate.toLocaleDateString()} to ${term.endDate.toLocaleDateString()}`
      );
    });

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
