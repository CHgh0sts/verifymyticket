const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const ADMIN = {
  username: "admin",
  email: "admin@verifymyticket.local",
  password: "Admin123!",
};

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  const user = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: {
      username: ADMIN.username,
      password: passwordHash,
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    create: {
      username: ADMIN.username,
      email: ADMIN.email,
      password: passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log("Compte admin prêt :");
  console.log(`  email    : ${ADMIN.email}`);
  console.log(`  username : ${ADMIN.username}`);
  console.log(`  password : ${ADMIN.password}`);
  console.log(`  id       : ${user.id}`);
  console.log(`  verified : ${user.emailVerified?.toISOString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
