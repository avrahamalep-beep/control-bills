"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ensureForSessionUser } from "@/lib/user-setup";
import { monthBounds } from "@/lib/finance-calc";
import { isFixedActiveInMonth } from "@/lib/fixed-active";

async function uid() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("לא מחובר");
  await ensureForSessionUser(s.user.id);
  return s.user.id;
}

export async function setMonthSalaryAction(year: number, month1to12: number, amount: number) {
  const userId = await uid();
  await prisma.monthSalary.upsert({
    where: { userId_year_month: { userId, year, month: month1to12 } },
    create: { userId, year, month: month1to12, amount },
    update: { amount },
  });
  revalidatePath("/");
}

export async function addMonthIncomeEntryAction(
  year: number,
  month1to12: number,
  label: string,
  amount: number
) {
  const userId = await uid();
  await prisma.monthIncomeEntry.create({
    data: {
      userId,
      year,
      month: month1to12,
      label: label.trim() || null,
      amount,
    },
  });
  revalidatePath("/");
}

export async function deleteMonthIncomeEntryAction(id: string) {
  const userId = await uid();
  await prisma.monthIncomeEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function setDefaultSalaryAction(v: number) {
  const userId = await uid();
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, defaultMonthlySalary: v, totalDebt: 0 },
    update: { defaultMonthlySalary: v },
  });
  revalidatePath("/");
}

export async function setTotalDebtAction(v: number) {
  const userId = await uid();
  await prisma.userSettings.upsert({
    where: { userId },
    create: { userId, defaultMonthlySalary: 18_000, totalDebt: v },
    update: { totalDebt: v },
  });
  revalidatePath("/");
}

export async function upsertBankAction(id: string | null, name: string, balance: number) {
  const userId = await uid();
  if (id) {
    await prisma.bankAccount.updateMany({ where: { id, userId }, data: { name, balance } });
  } else {
    const n = await prisma.bankAccount.count({ where: { userId } });
    await prisma.bankAccount.create({ data: { userId, name, balance, sortOrder: n } });
  }
  revalidatePath("/");
}

export async function deleteBankAction(id: string) {
  const userId = await uid();
  await prisma.bankAccount.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function addFixedAction(
  label: string,
  amount: number,
  dayOfMonth: number,
  validFrom: Date,
  totalMonths: number | null,
  endYear: number | null,
  endMonth1to12: number | null
) {
  const userId = await uid();
  const d = new Date(validFrom.getFullYear(), validFrom.getMonth(), 1, 12, 0, 0, 0);
  const hasEnd = endYear != null && endMonth1to12 != null && Number.isFinite(endYear) && Number.isFinite(endMonth1to12);
  await prisma.fixedPayment.create({
    data: {
      userId,
      label,
      amount,
      dayOfMonth,
      isActive: true,
      validFrom: d,
      totalMonths: totalMonths != null && totalMonths > 0 ? Math.floor(totalMonths) : null,
      endYear: hasEnd ? Math.floor(endYear!) : null,
      endMonth: hasEnd ? Math.min(12, Math.max(1, Math.floor(endMonth1to12!))) : null,
    },
  });
  revalidatePath("/");
}

export async function updateFixedAction(
  id: string,
  label: string,
  amount: number,
  dayOfMonth: number,
  validFrom: Date,
  totalMonths: number | null,
  endYear: number | null,
  endMonth1to12: number | null
) {
  const userId = await uid();
  const d = new Date(validFrom.getFullYear(), validFrom.getMonth(), 1, 12, 0, 0, 0);
  const hasEnd = endYear != null && endMonth1to12 != null && Number.isFinite(endYear) && Number.isFinite(endMonth1to12);
  await prisma.fixedPayment.updateMany({
    where: { id, userId },
    data: {
      label,
      amount,
      dayOfMonth: Math.min(31, Math.max(1, Math.floor(dayOfMonth))),
      validFrom: d,
      totalMonths: totalMonths != null && totalMonths > 0 ? Math.floor(totalMonths) : null,
      endYear: hasEnd ? Math.floor(endYear!) : null,
      endMonth: hasEnd ? Math.min(12, Math.max(1, Math.floor(endMonth1to12!))) : null,
    },
  });
  revalidatePath("/");
}

/** חודש אחרון שבו התשלום עדיין חל (כולל). מנקה totalMonths כדי שלא יהיו שני קצוות */
export async function setFixedEndInclusiveAction(id: string, endYear: number, endMonth1to12: number) {
  const userId = await uid();
  await prisma.fixedPayment.updateMany({
    where: { id, userId },
    data: {
      endYear: Math.floor(endYear),
      endMonth: Math.min(12, Math.max(1, Math.floor(endMonth1to12))),
      totalMonths: null,
    },
  });
  revalidatePath("/");
}

export async function deleteFixedAction(id: string) {
  const userId = await uid();
  await prisma.fixedPayment.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function addExtraAction(label: string, amount: number, dateIso: string) {
  const userId = await uid();
  await prisma.extraPayment.create({ data: { userId, label, amount, paidOn: new Date(dateIso) } });
  revalidatePath("/");
}

export async function deleteExtraAction(id: string) {
  const userId = await uid();
  await prisma.extraPayment.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function addCategoryAction(name: string, color?: string) {
  const userId = await uid();
  const n = await prisma.superCategory.count({ where: { userId } });
  await prisma.superCategory.create({ data: { userId, name, color, sortOrder: n } });
  revalidatePath("/");
}

export async function deleteCategoryAction(id: string) {
  const userId = await uid();
  const cat = await prisma.superCategory.findFirst({ where: { id, userId } });
  if (cat) {
    const cnt = await prisma.superPurchase.count({ where: { categoryId: id } });
    if (cnt > 0) throw new Error("יש מוצרים בקטגוריה — מחק/העבר לפני");
    await prisma.superCategory.delete({ where: { id } });
  }
  revalidatePath("/");
}

export async function addSuperPurchaseAction(
  categoryId: string,
  amount: number,
  description: string,
  dateIso: string
) {
  const userId = await uid();
  const cat = await prisma.superCategory.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new Error("קטגוריה");
  await prisma.superPurchase.create({
    data: { userId, categoryId, amount, description: description || null, boughtOn: new Date(dateIso) },
  });
  revalidatePath("/");
}

export async function deleteSuperPurchaseAction(id: string) {
  const userId = await uid();
  await prisma.superPurchase.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}

export async function loadAllForMonth(year: number, month0: number) {
  const userId = await uid();
  const { start, end } = monthBounds(year, month0);
  const row = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.monthSalary.findUnique({ where: { userId_year_month: { userId, year, month: month0 + 1 } } }),
    prisma.bankAccount.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.fixedPayment.findMany({ where: { userId, isActive: true }, orderBy: { dayOfMonth: "asc" } }),
    prisma.extraPayment.findMany({
      where: { userId, paidOn: { gte: start, lte: end } },
      orderBy: { paidOn: "desc" },
    }),
    prisma.superCategory.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.superPurchase.findMany({
      where: { userId, boughtOn: { gte: start, lte: end } },
      include: { category: true },
    }),
    prisma.monthIncomeEntry.findMany({
      where: { userId, year, month: month0 + 1 },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  let settings = row[0];
  if (!settings) {
    await ensureForSessionUser(userId);
    settings = await prisma.userSettings.findUnique({ where: { userId } });
  }
  if (!settings) throw new Error("UserSettings");
  const ms = row[1];
  const banks = row[2];
  const allFixed = row[3];
  const extras = row[4];
  const categories = row[5];
  const superPurchases = row[6];
  const monthIncomeEntries = row[7];
  const fixed = allFixed.filter((f) => isFixedActiveInMonth(f, year, month0));

  const def = settings.defaultMonthlySalary;
  const salaryThisMonth = ms?.amount ?? def;
  const otherIncomeTotal = monthIncomeEntries.reduce((a, e) => a + e.amount, 0);
  const totalIncomeMonth = salaryThisMonth + otherIncomeTotal;
  const totalBanks = banks.reduce((a, b) => a + b.balance, 0);
  const fixedTotal = fixed.reduce((a, b) => a + b.amount, 0);
  const extraTotal = extras.reduce((a, b) => a + b.amount, 0);
  const superTotal = superPurchases.reduce((a, b) => a + b.amount, 0);
  const monthOut = fixedTotal + extraTotal + superTotal;
  const endProjection = totalBanks + totalIncomeMonth - monthOut;
  const debt = settings.totalDebt;
  const salaryVsDebt = totalIncomeMonth - debt;
  const surplusOnSalary = totalIncomeMonth - monthOut;

  return {
    year,
    month0,
    settings,
    salaryThisMonth,
    otherIncomeTotal,
    totalIncomeMonth,
    hasMonthOverride: !!ms,
    totalBanks,
    fixedTotal,
    extraTotal,
    superTotal,
    monthOut,
    endProjection,
    debt,
    salaryVsDebt,
    surplusOnSalary,
    banks,
    fixed,
    allFixed,
    extras,
    categories,
    superPurchases,
    monthIncomeEntries,
  };
}

export async function getYearlyMonthTotals(year: number) {
  const userId = await uid();
  const yStart = new Date(year, 0, 1);
  const yEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const [fixed, extras, sp] = await Promise.all([
    prisma.fixedPayment.findMany({ where: { userId, isActive: true } }),
    prisma.extraPayment.findMany({ where: { userId, paidOn: { gte: yStart, lte: yEnd } } }),
    prisma.superPurchase.findMany({ where: { userId, boughtOn: { gte: yStart, lte: yEnd } } }),
  ]);

  const fSum = (y: number, m0: number) => {
    if (y !== year) return 0;
    const t = { start: new Date(year, m0, 1), end: new Date(year, m0 + 1, 0, 23, 59, 59, 999) };
    const activeFixed = fixed.filter((f) => isFixedActiveInMonth(f, y, m0));
    const e = extras.filter((x) => x.paidOn >= t.start && x.paidOn <= t.end).reduce((a, b) => a + b.amount, 0);
    const s = sp.filter((x) => x.boughtOn >= t.start && x.boughtOn <= t.end).reduce((a, b) => a + b.amount, 0);
    return activeFixed.reduce((a, b) => a + b.amount, 0) + e + s;
  };

  return { byMonth: Array.from({ length: 12 }, (_, m0) => fSum(year, m0)) };
}

export async function formDefaultSalary(fd: FormData) {
  "use server";
  const v = Number(fd.get("v"));
  if (Number.isFinite(v)) await setDefaultSalaryAction(v);
}

export async function formTotalDebt(fd: FormData) {
  "use server";
  const v = Number(fd.get("v"));
  if (Number.isFinite(v)) await setTotalDebtAction(v);
}

export async function formMonthSalary(fd: FormData) {
  "use server";
  const y = Number(fd.get("y"));
  const m = Number(fd.get("m"));
  const a = Number(fd.get("a"));
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(a) && a >= 0) {
    await setMonthSalaryAction(y, m, a);
  }
}

export async function formAddMonthIncome(fd: FormData) {
  "use server";
  const y = Number(fd.get("y"));
  const m = Number(fd.get("m"));
  const label = String(fd.get("label") ?? "");
  const amount = Number(fd.get("amount"));
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  await addMonthIncomeEntryAction(y, m, label, amount);
}

export async function formDeleteMonthIncome(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) await deleteMonthIncomeEntryAction(id);
}

export async function formBank(fd: FormData) {
  "use server";
  const id = fd.get("id") as string | null;
  const name = String(fd.get("name") ?? "").trim();
  const balance = Number(fd.get("balance"));
  if (!name || !Number.isFinite(balance)) return;
  await upsertBankAction(id && id.length > 0 ? id : null, name, balance);
}

export async function formDeleteBank(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) await deleteBankAction(id);
}

export async function formAddFixed(fd: FormData) {
  "use server";
  const label = String(fd.get("label") ?? "").trim();
  const amount = Number(fd.get("amount"));
  const day = Number(fd.get("day") ?? 1);
  const sy = Number(fd.get("startYear"));
  const sm = Number(fd.get("startMonth"));
  const nmRaw = String(fd.get("numMonths") ?? "").trim();
  const nm = nmRaw === "" ? null : Number(nmRaw);
  const eyRaw = String(fd.get("endYear") ?? "").trim();
  const emRaw = String(fd.get("endMonth") ?? "").trim();
  const ey = eyRaw === "" ? null : Number(eyRaw);
  const em = emRaw === "" ? null : Number(emRaw);
  if (!label || !Number.isFinite(amount) || !Number.isFinite(day)) return;
  if (!Number.isFinite(sy) || !Number.isFinite(sm) || sm < 1 || sm > 12) return;
  const validFrom = new Date(sy, sm - 1, 1);
  const totalMonths = nm != null && Number.isFinite(nm) && nm > 0 ? nm : null;
  const hasEnd = ey != null && em != null && Number.isFinite(ey) && Number.isFinite(em) && em >= 1 && em <= 12;
  await addFixedAction(
    label,
    amount,
    Math.min(31, Math.max(1, Math.floor(day))),
    validFrom,
    totalMonths,
    hasEnd ? ey : null,
    hasEnd ? em : null
  );
}

export async function formUpdateFixed(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  const label = String(fd.get("label") ?? "").trim();
  const amount = Number(fd.get("amount"));
  const day = Number(fd.get("day") ?? 1);
  const sy = Number(fd.get("startYear"));
  const sm = Number(fd.get("startMonth"));
  const nmRaw = String(fd.get("numMonths") ?? "").trim();
  const nm = nmRaw === "" ? null : Number(nmRaw);
  const eyRaw = String(fd.get("endYear") ?? "").trim();
  const emRaw = String(fd.get("endMonth") ?? "").trim();
  const ey = eyRaw === "" ? null : Number(eyRaw);
  const em = emRaw === "" ? null : Number(emRaw);
  if (!id || !label || !Number.isFinite(amount) || !Number.isFinite(day)) return;
  if (!Number.isFinite(sy) || !Number.isFinite(sm) || sm < 1 || sm > 12) return;
  const validFrom = new Date(sy, sm - 1, 1);
  const totalMonths = nm != null && Number.isFinite(nm) && nm > 0 ? nm : null;
  const hasEnd = ey != null && em != null && Number.isFinite(ey) && Number.isFinite(em) && em >= 1 && em <= 12;
  await updateFixedAction(
    id,
    label,
    amount,
    day,
    validFrom,
    totalMonths,
    hasEnd ? ey : null,
    hasEnd ? em : null
  );
}

export async function formCloseFixedThisMonth(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  const y = Number(fd.get("y"));
  const m = Number(fd.get("m"));
  if (!id || !Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return;
  await setFixedEndInclusiveAction(id, y, m);
}

export async function formDeleteFixed(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) await deleteFixedAction(id);
}

export async function formAddExtra(fd: FormData) {
  "use server";
  const label = String(fd.get("label") ?? "").trim();
  const amount = Number(fd.get("amount"));
  const date = String(fd.get("date") ?? "");
  if (!label || !Number.isFinite(amount) || !date) return;
  await addExtraAction(label, amount, date);
}

export async function formDeleteExtra(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) await deleteExtraAction(id);
}

export async function formAddCategory(fd: FormData) {
  "use server";
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "").trim() || undefined;
  if (!name) return;
  try {
    await addCategoryAction(name, color);
  } catch {
    /* P2002 */
  }
}

export async function formDeleteCategory(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) {
    try {
      await deleteCategoryAction(id);
    } catch {
      /* */
    }
  }
}

export async function formAddSuper(fd: FormData) {
  "use server";
  const categoryId = String(fd.get("categoryId") ?? "");
  const amount = Number(fd.get("amount"));
  const desc = String(fd.get("description") ?? "");
  const date = String(fd.get("date") ?? "");
  if (!categoryId || !Number.isFinite(amount) || !date) return;
  await addSuperPurchaseAction(categoryId, amount, desc, date);
}

export async function formDeleteSuper(fd: FormData) {
  "use server";
  const id = String(fd.get("id") ?? "");
  if (id) await deleteSuperPurchaseAction(id);
}


