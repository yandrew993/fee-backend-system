import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function seedAdmin() {
  try {
    console.log("🌱 Seeding default admin user...");

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: "admin@feesystem.com",
      },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists!");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash("Admin@123456", 10);

    // Create the admin user
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@feesystem.com",
        password: hashedPassword,
        fullName: "System Administrator",
        phone: "+1234567890",
        role: "admin",
      },
    });

    console.log("✅ Default admin user created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    admin@feesystem.com`);
    console.log(`👤 Username: admin`);
    console.log(`🔐 Password: Admin@123456`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");
    console.log("\n✨ Admin user is ready to access the system.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
