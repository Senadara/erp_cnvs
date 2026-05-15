import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wasteLog.deleteMany();
  await prisma.restockLog.deleteMany();
  await prisma.pettyCash.deleteMany();
  await prisma.shiftRecord.deleteMany();
  await prisma.conversion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.displayGroup.deleteMany();
  await prisma.mitraStockScope.deleteMany();
  await prisma.mitraProductScope.deleteMany();
  await prisma.userOutlet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.outlet.deleteMany();

  const outlet = await prisma.outlet.create({
    data: { name: "Outlet Utama", address: null, phone: null },
  });

  const stockGroup = await prisma.displayGroup.create({
    data: { name: "Bahan", sortOrder: 0, context: "STOCK", outletId: outlet.id },
  });
  const dgRotiJohn = await prisma.displayGroup.create({
    data: { name: "Roti John", sortOrder: 0, context: "PRODUCT", outletId: outlet.id },
  });
  const dgOther = await prisma.displayGroup.create({
    data: { name: "Menu lain", sortOrder: 1, context: "PRODUCT", outletId: outlet.id },
  });

  const stockNames = [
    "Dimsum",
    "Gyoza",
    "Udang Keju",
    "Dimsum Goreng",
    "Roti John 20 CM",
    "Roti John 30 CM",
    "Roti Toast",
    "Toping Manis - Chocolate",
    "Toping Manis - Matcha",
    "Toping Manis - Choco Crunchy",
    "Toping Manis - Tiramisu",
    "Toping Manis - Keju",
    "Toping Manis - Vanila",
    "Toping Asin - Beef",
    "Toping Asin - Sosis",
    "Toping Asin - Telur",
    "Toping Asin - Tomat",
    "Toping Asin - Salad",
    "Toping Asin - Bawang Bombai",
    "Toping Asin - Saos BBQ",
    "Toping Asin - Saos Sambal",
    "Toping Asin - Mayonaise",
    "Powder Matcha",
    "Powder Chocolate",
    "Powder Creamer",
    "Powder SKM",
    "Saus Bangkok",
    "Saus Mentai",
    "Nori",
  ];

  const stockMap: Record<string, string> = {};
  for (const name of stockNames) {
    const trackable = !name.startsWith("Saus ") && !name.startsWith("Powder ");
    const row = await prisma.stockItem.create({
      data: {
        outletId: outlet.id,
        name,
        currentStock: "800",
        unitName: "biji",
        minStockAlert: "40",
        trackable,
        countingBasis: "BIJI",
        displayGroupId: stockGroup.id,
      },
    });
    stockMap[name] = row.id;
  }

  type P = {
    name: string;
    category: string;
    price: string;
    hpp: string;
    conv: { stock: string; ratio: string }[];
  };

  const products: P[] = [
    {
      name: "Dimsum Ori",
      category: "Dimsum",
      price: "18000",
      hpp: "9000",
      conv: [{ stock: "Dimsum", ratio: "6" }],
    },
    {
      name: "Dimsum Mentai",
      category: "Dimsum",
      price: "25000",
      hpp: "12000",
      conv: [
        { stock: "Dimsum", ratio: "6" },
        { stock: "Saus Mentai", ratio: "1" },
      ],
    },
    {
      name: "Dimsum Mix",
      category: "Dimsum",
      price: "20000",
      hpp: "10000",
      conv: [{ stock: "Dimsum", ratio: "6" }],
    },
    {
      name: "Dimsum Mentai Cheese",
      category: "Dimsum",
      price: "28000",
      hpp: "14000",
      conv: [
        { stock: "Dimsum", ratio: "6" },
        { stock: "Saus Mentai", ratio: "1" },
      ],
    },
    {
      name: "Gyoza Kukus",
      category: "Dimsum",
      price: "22000",
      hpp: "11000",
      conv: [{ stock: "Gyoza", ratio: "5" }],
    },
    {
      name: "Gyoza Goreng",
      category: "Dimsum",
      price: "24000",
      hpp: "12000",
      conv: [{ stock: "Gyoza", ratio: "5" }],
    },
    {
      name: "Dimsum Goreng Lumer",
      category: "Dimsum",
      price: "26000",
      hpp: "13000",
      conv: [{ stock: "Dimsum Goreng", ratio: "4" }],
    },
    {
      name: "Udang Keju",
      category: "Dimsum",
      price: "30000",
      hpp: "15000",
      conv: [{ stock: "Udang Keju", ratio: "4" }],
    },
    {
      name: "Roti Toast",
      category: "Roti",
      price: "12000",
      hpp: "6000",
      conv: [{ stock: "Roti Toast", ratio: "1" }],
    },
    {
      name: "Es Matcha",
      category: "Minuman",
      price: "15000",
      hpp: "5000",
      conv: [
        { stock: "Powder Matcha", ratio: "2" },
        { stock: "Powder Creamer", ratio: "3" },
        { stock: "Powder SKM", ratio: "2" },
      ],
    },
    {
      name: "Es Chocolate",
      category: "Minuman",
      price: "15000",
      hpp: "5000",
      conv: [
        { stock: "Powder Chocolate", ratio: "2" },
        { stock: "Powder Creamer", ratio: "3" },
        { stock: "Powder SKM", ratio: "2" },
      ],
    },
    {
      name: "Manis Reguler",
      category: "Roti John",
      price: "20000",
      hpp: "9000",
      conv: [
        { stock: "Roti John 20 CM", ratio: "1" },
        { stock: "Toping Manis - Chocolate", ratio: "2" },
      ],
    },
    {
      name: "Manis Large",
      category: "Roti John",
      price: "28000",
      hpp: "13000",
      conv: [
        { stock: "Roti John 30 CM", ratio: "1" },
        { stock: "Toping Manis - Chocolate", ratio: "3" },
      ],
    },
    {
      name: "Asin Reguler",
      category: "Roti John",
      price: "20000",
      hpp: "9000",
      conv: [
        { stock: "Roti John 20 CM", ratio: "1" },
        { stock: "Toping Asin - Beef", ratio: "2" },
      ],
    },
    {
      name: "Asin Large",
      category: "Roti John",
      price: "28000",
      hpp: "13000",
      conv: [
        { stock: "Roti John 30 CM", ratio: "1" },
        { stock: "Toping Asin - Beef", ratio: "3" },
      ],
    },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i]!;
    const imageUrl =
      i < 5
        ? `https://picsum.photos/seed/${encodeURIComponent(p.name)}/400/400`
        : null;
    const prod = await prisma.product.create({
      data: {
        outletId: outlet.id,
        name: p.name,
        category: p.category,
        price: p.price,
        hpp: p.hpp,
        isActive: true,
        imageUrl,
        displayGroupId: p.category === "Roti John" ? dgRotiJohn.id : dgOther.id,
      },
    });
    for (const c of p.conv) {
      const sid = stockMap[c.stock];
      if (!sid) throw new Error(`Missing stock: ${c.stock}`);
      await prisma.conversion.create({
        data: {
          productId: prod.id,
          stockItemId: sid,
          ratio: c.ratio,
        },
      });
    }
  }

  await prisma.shiftRecord.create({
    data: {
      outletId: outlet.id,
      openingCash: "200000",
      status: "OPEN",
    },
  });

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@karsa.local";
  const ownerPass = process.env.SEED_OWNER_PASSWORD ?? "Owner123!";
  const hash = await bcrypt.hash(ownerPass, 10);
  await prisma.user.create({
    data: {
      email: ownerEmail,
      passwordHash: hash,
      displayName: "Owner",
      role: "OWNER",
      outlets: { create: [{ outletId: outlet.id }] },
    },
  });

  console.log("Seed selesai. Outlet:", outlet.id, "| Owner login:", ownerEmail, "/", ownerPass);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
