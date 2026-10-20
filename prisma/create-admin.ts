import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

async function main() {
  const [name, phone, password, email] = process.argv.slice(2);

  if (!name || !phone || !password) {
    console.error('Usage: npx tsx prisma/create-admin.ts "Full Name" 01XXXXXXXXX "Password" [email]');
    process.exit(1);
  }
  if (!/^01[3-9]\d{8}$/.test(phone)) throw new Error("Invalid mobile number");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  // If this phone already has an account, it is only promoted to ADMIN (password unchanged)
  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: "ADMIN" },
    create: {
      name,
      phone,
      email: email ? email.toLowerCase() : null,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  console.log(`Admin ready: ${user.name} (${user.phone})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });