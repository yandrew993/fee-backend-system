import bcrypt from "bcrypt";
import prisma from "./lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("🌱 Starting seed...");

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "admin@fee-system.com" },
          { username: "admin" }
        ]
      }
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists!");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    // Create default admin user
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@fee-system.com",
        password: hashedPassword,
        fullName: "Admin User",
        phone: "+1234567890",
        role: "admin",
      },
    });

    console.log("✅ Default admin user created successfully!");
    console.log("\n📋 Default Admin Credentials:");
    console.log("================================");
    console.log("Email/Username: admin");
    console.log("Password:       Admin@123");
    console.log("================================\n");

  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
