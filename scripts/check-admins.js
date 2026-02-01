import prisma from "../lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function checkAdmins() {
  try {
    console.log("🔍 Checking existing admin users...\n");

    const admins = await prisma.user.findMany({
      where: {
        role: "admin",
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    if (admins.length === 0) {
      console.log("❌ No admin users found!");
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`);
      admins.forEach((admin, index) => {
        console.log(`👤 Admin ${index + 1}:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Full Name: ${admin.fullName}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.createdAt.toLocaleString()}`);
        console.log("");
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking admin users:", error.message);
    process.exit(1);
  }
}

checkAdmins();
