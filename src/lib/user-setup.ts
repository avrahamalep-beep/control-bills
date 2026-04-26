import { prisma } from "./db";

const defaultCategories = [
  { name: "בסיס — סופר", color: "#22c55e", sort: 0 },
  { name: "בגדים", color: "#3b82f6", sort: 1 },
  { name: "טכנולוגיה", color: "#8b5cf6", sort: 2 },
  { name: "בית / כלים", color: "#f97316", sort: 3 },
];

export async function ensureUserDefaults(userId: string) {
  const existing = await prisma.userSettings.findUnique({ where: { userId } });
  if (existing) return;

  await prisma.$transaction([
    prisma.userSettings.create({
      data: { userId, defaultMonthlySalary: 18_000, totalDebt: 0 },
    }),
    prisma.bankAccount.createMany({
      data: [
        { userId, name: "בנק 1", balance: 0, sortOrder: 0 },
        { userId, name: "בנק 2", balance: 0, sortOrder: 1 },
      ],
    }),
    prisma.superCategory.createMany({
      data: defaultCategories.map((c) => ({
        userId,
        name: c.name,
        color: c.color,
        sortOrder: c.sort,
      })),
    }),
  ]);
}

export async function ensureForSessionUser(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) await ensureUserDefaults(userId);
}
