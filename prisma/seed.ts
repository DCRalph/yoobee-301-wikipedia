import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  // Create a site settings record if one doesn't exist
  const settingsCount = await prisma.setting.count();
  if (settingsCount === 0) {
    await prisma.setting.create({
      data: {
        allowRegistration: true,
        allowArticleCreation: true,
        enableAIFeatures: false,
      },
    });
    console.log("Created default site settings");
  }

  // Create admin user if it doesn't exist
  const adminEmail = "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        role: Role.ADMIN,
      },
    });

    // Add password-based account for admin
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: admin.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: adminEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created admin user with email ${adminEmail}`);
  }

  // Create regular user if it doesn't exist
  const userEmail = "user@example.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    // Create regular user
    const user = await prisma.user.create({
      data: {
        name: "Regular User",
        email: userEmail,
        role: Role.USER,
      },
    });

    // Add password-based account for user
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: userEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created regular user with email ${userEmail}`);
  }

  // Create moderator if it doesn't exist
  const modEmail = "moderator@example.com";
  const existingMod = await prisma.user.findUnique({
    where: { email: modEmail },
  });

  if (!existingMod) {
    // Create moderator user
    const mod = await prisma.user.create({
      data: {
        name: "Moderator User",
        email: modEmail,
        role: Role.MODERATOR,
      },
    });

    // Add password-based account for moderator
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: mod.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: modEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created moderator user with email ${modEmail}`);
  }

  console.log("Seed process completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
