/**
 * Seed ringan untuk cPanel: hanya outlet + akun owner (tanpa hapus data demo).
 * Jalankan: npm run cpanel:seed:owner
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`[seed-owner] Lewati: sudah ada ${existing} user.`);
    return;
  }

  let outlet = await prisma.outlet.findFirst();
  if (!outlet) {
    outlet = await prisma.outlet.create({
      data: { name: "Outlet Utama", address: null, phone: null },
    });
    console.log("[seed-owner] Outlet dibuat:", outlet.id);
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@karsa.local";
  const ownerPass = process.env.SEED_OWNER_PASSWORD ?? "Owner123!";
  const passwordHash = await bcrypt.hash(ownerPass, 10);

  await prisma.user.create({
    data: {
      email: ownerEmail,
      passwordHash,
      displayName: "Owner",
      role: "OWNER",
      outlets: { create: [{ outletId: outlet.id }] },
    },
  });

  console.log("[seed-owner] Selesai. Login:", ownerEmail, "/", ownerPass);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
