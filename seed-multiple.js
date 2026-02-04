// Seed script for creating multiple admin and staff users
// Run this after the initial setup if needed

import bcrypt from "bcrypt";
import prisma from "./lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function seedMultipleUsers() {
  try {
    console.log("🌱 Seeding multiple users...\n");

    const users = [
      {
        username: "admin",
        email: "admin@fee-system.com",
        password: "Admin@123",
        fullName: "Administrator",
        phone: "+1234567890",
        role: "admin"
      },
      {
        username: "accountant1",
        email: "accountant@fee-system.com",
        password: "Accountant@123",
        fullName: "John Accountant",
        phone: "+1234567891",
        role: "accountant"
      },
      {
        username: "teacher1",
        email: "teacher@fee-system.com",
        password: "Teacher@123",
        fullName: "Sarah Teacher",
        phone: "+1234567892",
        role: "teacher"
      }
    ];

    for (const userData of users) {
      // Check if user exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped ${userData.username} - already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          fullName: userData.fullName,
          phone: userData.phone,
          role: userData.role
        }
      });

      console.log(`✅ Created ${userData.username} (${userData.role})`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔑 Password: ${userData.password}\n`);
    }

    console.log("================================");
    console.log("✅ All users seeded successfully!");
    console.log("================================\n");

  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMultipleUsers();
