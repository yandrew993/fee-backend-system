import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await prisma.receipt.deleteMany({});
    await prisma.feePayment.deleteMany({});
    await prisma.studentFeeStatement.deleteMany({});
    await prisma.classFee.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.academicTerm.deleteMany({});
    console.log("✅ Database cleared\n");

    // 1. Seed AcademicTerms
    console.log("📅 Seeding AcademicTerms...");
    const academicTerms = await prisma.academicTerm.createMany({
      data: [
        {
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
        {
          academicYear: "2025-2026",
          term1Name: "Term 1",
          term1StartDate: new Date("2025-01-15"),
          term1EndDate: new Date("2025-04-15"),
          term1Duration: 4,
          term2Name: "Term 2",
          term2StartDate: new Date("2025-05-15"),
          term2EndDate: new Date("2025-08-15"),
          term2Duration: 4,
          term3Name: "Term 3",
          term3StartDate: new Date("2025-09-01"),
          term3EndDate: new Date("2025-11-30"),
          term3Duration: 3,
          isActive: false,
        },
      ],
    });
    console.log(`✅ Created ${academicTerms.count} academic terms\n`);

    // 2. Seed Users (Admin, Accountants)
    console.log("👥 Seeding Users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = await prisma.user.createMany({
      data: [
        {
          email: "admin@school.com",
          username: "admin",
          password: hashedPassword,
          fullName: "Admin User",
          phone: "+254712345678",
          role: "admin",
        },
        {
          email: "accountant1@school.com",
          username: "accountant1",
          password: hashedPassword,
          fullName: "John Accountant",
          phone: "+254712345679",
          role: "accountant",
        },
        {
          email: "accountant2@school.com",
          username: "accountant2",
          password: hashedPassword,
          fullName: "Jane Accountant",
          phone: "+254712345680",
          role: "accountant",
        },
      ],
    });
    console.log(`✅ Created ${users.count} users\n`);

    // Get admin user for fee payments
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    // 3. Seed Classes
    console.log("🏫 Seeding Classes...");
    const classes = await prisma.class.createMany({
      data: [
        { className: "Form 1A", description: "Form 1 Class A" },
        { className: "Form 1B", description: "Form 1 Class B" },
        { className: "Form 2A", description: "Form 2 Class A" },
        { className: "Form 2B", description: "Form 2 Class B" },
        { className: "Form 3A", description: "Form 3 Class A" },
        { className: "Form 4A", description: "Form 4 Class A" },
      ],
    });
    console.log(`✅ Created ${classes.count} classes\n`);

    // Get created classes
    const form1A = await prisma.class.findFirst({
      where: { className: "Form 1A" },
    });
    const form2A = await prisma.class.findFirst({
      where: { className: "Form 2A" },
    });
    const form3A = await prisma.class.findFirst({
      where: { className: "Form 3A" },
    });

    // 4. Seed Students
    console.log("👨‍🎓 Seeding Students...");
    const students = await prisma.student.createMany({
      data: [
        // Form 1A students
        {
          admissionNumber: "ADM001",
          fullName: "John Michael Smith",
          gender: "Male",
          parentName: "Michael Smith Sr.",
          parentPhone: "+254712345681",
          status: "active",
          classId: form1A.id,
        },
        {
          admissionNumber: "ADM002",
          fullName: "Jane Elizabeth Doe",
          gender: "Female",
          parentName: "John Doe",
          parentPhone: "+254712345682",
          status: "active",
          classId: form1A.id,
        },
        {
          admissionNumber: "ADM003",
          fullName: "Robert James Johnson",
          gender: "Male",
          parentName: "James Johnson",
          parentPhone: "+254712345683",
          status: "active",
          classId: form1A.id,
        },
        {
          admissionNumber: "ADM004",
          fullName: "Sarah Michelle Williams",
          gender: "Female",
          parentName: "David Williams",
          parentPhone: "+254712345684",
          status: "active",
          classId: form1A.id,
        },
        {
          admissionNumber: "ADM005",
          fullName: "David Alexander Brown",
          gender: "Male",
          parentName: "Alexander Brown",
          parentPhone: "+254712345685",
          status: "active",
          classId: form1A.id,
        },
        // Form 2A students
        {
          admissionNumber: "ADM006",
          fullName: "Emma Louise Davis",
          gender: "Female",
          parentName: "Charles Davis",
          parentPhone: "+254712345686",
          status: "active",
          classId: form2A.id,
        },
        {
          admissionNumber: "ADM007",
          fullName: "Michael Christopher Wilson",
          gender: "Male",
          parentName: "Christopher Wilson",
          parentPhone: "+254712345687",
          status: "active",
          classId: form2A.id,
        },
        // Form 3A students
        {
          admissionNumber: "ADM008",
          fullName: "Lisa Margaret Martinez",
          gender: "Female",
          parentName: "Thomas Martinez",
          parentPhone: "+254712345688",
          status: "active",
          classId: form3A.id,
        },
      ],
    });
    console.log(`✅ Created ${students.count} students\n`);

    // Get created students
    const john = await prisma.student.findFirst({
      where: { admissionNumber: "ADM001" },
    });
    const jane = await prisma.student.findFirst({
      where: { admissionNumber: "ADM002" },
    });
    const robert = await prisma.student.findFirst({
      where: { admissionNumber: "ADM003" },
    });

    // 5. Seed ClassFees
    console.log("💰 Seeding ClassFees...");
    const classFees = await prisma.classFee.createMany({
      data: [
        // Form 1A - Term 1
        {
          name: "Tuition",
          classId: form1A.id,
          className: "Form 1A",
          term: "term1",
          amount: 5000,
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
          description: "Monthly tuition fee",
          isRecurring: true,
        },
        {
          name: "Lab Fee",
          classId: form1A.id,
          className: "Form 1A",
          term: "term1",
          amount: 500,
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
          description: "Science lab fee",
          isRecurring: true,
        },
        {
          name: "Sports Fee",
          classId: form1A.id,
          className: "Form 1A",
          term: "term1",
          amount: 300,
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
          description: "Sports and games fee",
          isRecurring: true,
        },
        // Form 1A - Term 2
        {
          name: "Tuition",
          classId: form1A.id,
          className: "Form 1A",
          term: "term2",
          amount: 5000,
          termStartDate: new Date("2024-05-15"),
          termEndDate: new Date("2024-08-15"),
          dueDate: new Date("2024-06-15"),
          description: "Monthly tuition fee",
          isRecurring: true,
        },
        {
          name: "Lab Fee",
          classId: form1A.id,
          className: "Form 1A",
          term: "term2",
          amount: 500,
          termStartDate: new Date("2024-05-15"),
          termEndDate: new Date("2024-08-15"),
          dueDate: new Date("2024-06-15"),
          description: "Science lab fee",
          isRecurring: true,
        },
        // Form 1A - Term 3
        {
          name: "Tuition",
          classId: form1A.id,
          className: "Form 1A",
          term: "term3",
          amount: 5000,
          termStartDate: new Date("2024-09-01"),
          termEndDate: new Date("2024-11-30"),
          dueDate: new Date("2024-10-01"),
          description: "Monthly tuition fee",
          isRecurring: true,
        },
        // Form 2A - Term 1
        {
          name: "Tuition",
          classId: form2A.id,
          className: "Form 2A",
          term: "term1",
          amount: 5500,
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
          description: "Monthly tuition fee",
          isRecurring: true,
        },
        {
          name: "Lab Fee",
          classId: form2A.id,
          className: "Form 2A",
          term: "term1",
          amount: 600,
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
          description: "Advanced science lab fee",
          isRecurring: true,
        },
      ],
    });
    console.log(`✅ Created ${classFees.count} class fees\n`);

    // 6. Seed StudentFeeStatements
    console.log("📋 Seeding StudentFeeStatements...");
    const statements = await prisma.studentFeeStatement.createMany({
      data: [
        // John - Term 1 (Form 1A)
        {
          studentId: john.id,
          academicYear: "2024-2025",
          term: "term1",
          currentTermFee: 5800, // Tuition 5000 + Lab 500 + Sports 300
          previousBalance: 0,
          totalPayable: 5800,
          amountPaid: 0,
          balanceAmount: 5800,
          status: "pending",
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
        },
        // Jane - Term 1 (Form 1A)
        {
          studentId: jane.id,
          academicYear: "2024-2025",
          term: "term1",
          currentTermFee: 5800,
          previousBalance: 0,
          totalPayable: 5800,
          amountPaid: 2000,
          balanceAmount: 3800,
          status: "pending",
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
        },
        // Robert - Term 1 (Form 1A)
        {
          studentId: robert.id,
          academicYear: "2024-2025",
          term: "term1",
          currentTermFee: 5800,
          previousBalance: 0,
          totalPayable: 5800,
          amountPaid: 5800,
          balanceAmount: 0,
          status: "completed",
          termStartDate: new Date("2024-01-15"),
          termEndDate: new Date("2024-04-15"),
          dueDate: new Date("2024-02-15"),
        },
      ],
    });
    console.log(`✅ Created ${statements.count} student fee statements\n`);

    // Get created statements
    const johnTerm1 = await prisma.studentFeeStatement.findFirst({
      where: { studentId: john.id, term: "term1" },
    });
    const janeTerm1 = await prisma.studentFeeStatement.findFirst({
      where: { studentId: jane.id, term: "term1" },
    });
    const robertTerm1 = await prisma.studentFeeStatement.findFirst({
      where: { studentId: robert.id, term: "term1" },
    });

    // 7. Seed FeePayments
    console.log("💳 Seeding FeePayments...");
    const feePayments = await prisma.feePayment.createMany({
      data: [
        // Jane's payment (partial)
        {
          referenceNumber: "FP-001",
          studentId: jane.id,
          studentFeeStatementId: janeTerm1.id,
          classFeeId: null,
          amount: 2000,
          paymentMethod: "cash",
          paymentDate: new Date("2024-02-20"),
          status: "completed",
          notes: "First installment received",
          createdById: adminUser.id,
        },
        // Robert's payment (full)
        {
          referenceNumber: "FP-002",
          studentId: robert.id,
          studentFeeStatementId: robertTerm1.id,
          classFeeId: null,
          amount: 5800,
          paymentMethod: "bank_transfer",
          paymentDate: new Date("2024-02-15"),
          status: "completed",
          notes: "Full payment via bank transfer",
          createdById: adminUser.id,
        },
      ],
    });
    console.log(`✅ Created ${feePayments.count} fee payments\n`);

    // Get created payments
    const janePayment = await prisma.feePayment.findFirst({
      where: { referenceNumber: "FP-001" },
    });
    const robertPayment = await prisma.feePayment.findFirst({
      where: { referenceNumber: "FP-002" },
    });

    // 8. Seed Receipts
    console.log("🧾 Seeding Receipts...");
    const receipts = await prisma.receipt.createMany({
      data: [
        // Receipt for Jane's payment
        {
          receiptNumber: "RCP-001",
          studentId: jane.id,
          feePaymentId: janePayment.id,
          amount: 2000,
          paymentMethod: "cash",
          paymentDate: new Date("2024-02-20"),
          description: "Payment receipt for Term 1 tuition - First installment",
        },
        // Receipt for Robert's payment
        {
          receiptNumber: "RCP-002",
          studentId: robert.id,
          feePaymentId: robertPayment.id,
          amount: 5800,
          paymentMethod: "bank_transfer",
          paymentDate: new Date("2024-02-15"),
          description: "Payment receipt for Term 1 tuition - Full payment",
        },
      ],
    });
    console.log(`✅ Created ${receipts.count} receipts\n`);

    // Summary Report
    console.log("\n" + "=".repeat(60));
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60) + "\n");

    console.log("📊 SUMMARY:");
    console.log(`   • Academic Terms: ${academicTerms.count}`);
    console.log(`   • Users: ${users.count}`);
    console.log(`   • Classes: ${classes.count}`);
    console.log(`   • Students: ${students.count}`);
    console.log(`   • Class Fees: ${classFees.count}`);
    console.log(`   • Student Fee Statements: ${statements.count}`);
    console.log(`   • Fee Payments: ${feePayments.count}`);
    console.log(`   • Receipts: ${receipts.count}`);

    console.log("\n🔐 LOGIN CREDENTIALS:");
    console.log("   Admin:");
    console.log("     • Email: admin@school.com");
    console.log("     • Username: admin");
    console.log("     • Password: password123");
    console.log("\n   Accountant 1:");
    console.log("     • Email: accountant1@school.com");
    console.log("     • Username: accountant1");
    console.log("     • Password: password123");

    console.log("\n📚 SAMPLE DATA DETAILS:");
    console.log("\n   Students in Form 1A:");
    console.log("     • John Michael Smith (ADM001) - Balance: 5800 (Pending)");
    console.log("     • Jane Elizabeth Doe (ADM002) - Balance: 3800 (Pending)");
    console.log("     • Robert James Johnson (ADM003) - Balance: 0 (Completed)");
    console.log("     • Sarah Michelle Williams (ADM004)");
    console.log("     • David Alexander Brown (ADM005)");

    console.log("\n   Fees Structure (Form 1A, Term 1):");
    console.log("     • Tuition: 5000");
    console.log("     • Lab Fee: 500");
    console.log("     • Sports Fee: 300");
    console.log("     • Total: 5800");

    console.log("\n🚀 NEXT STEPS:");
    console.log("   1. Start the API server: npm start");
    console.log("   2. Test endpoints using the API documentation");
    console.log("   3. Login with provided credentials");
    console.log("   4. Create more students/fees as needed");

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
