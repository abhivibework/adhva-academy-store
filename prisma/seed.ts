import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Adhva Academy",
      tagline: "The Learning Path",
      footerText: "Adhva Academy — The Learning Path",
      razorpayEnabled: true,
      cashfreeEnabled: false,
      defaultGateway: "RAZORPAY",
    },
  });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipped admin user.");
    return;
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(password, 12),
        role: "ADMIN",
      },
    });
  }

  console.log(`Admin ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
