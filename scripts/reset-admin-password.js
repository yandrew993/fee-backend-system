import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import dotenv from "dotenv";

dotenv.config();

async function resetAdminPassword() {
  try {
    console.log("🔐 Resetting admin password...\n");

    const newPassword = "Admin@123456";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const admin = await prisma.user.update({
      where: {
        username: "admin",
      },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    console.log("✅ Admin password reset successfully!\n");
    console.log("📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email:    ${admin.email}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🔐 Password: ${newPassword}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");
    console.log("\n✨ You can now login to the admin panel.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting admin password:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
