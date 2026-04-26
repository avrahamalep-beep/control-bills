import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { t } from "@/lib/i18n";
import {
  loadAllForMonth,
  getYearlyMonthTotals,
  formDefaultSalary,
  formTotalDebt,
  formMonthSalary,
  formAddMonthIncome,
  formDeleteMonthIncome,
  formBank,
  formDeleteBank,
  formAddFixed,
  formUpdateFixed,
  formCloseFixedThisMonth,
  formDeleteFixed,
  formAddExtra,
  formDeleteExtra,
  formAddCategory,
  formDeleteCategory,
  formAddSuper,
  formDeleteSuper,
} from "@/app/actions/finance";
import { isFixedActiveInMonth, monthIndexFromValidFrom } from "@/lib/fixed-active";
import { signOutAction } from "@/app/actions/auth-actions";
import { SuperPie, YearBars } from "@/components/charts";

function nis(v: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v);
}

type Search = { y?: string; m?: string };

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const now = new Date();
  const y = sp.y != null && !Number.isNaN(parseInt(sp.y, 10)) ? parseInt(sp.y, 10) : now.getFullYear();
  const m0 = sp.m != null && !Number.isNaN(parseInt(sp.m, 10)) ? Math.max(0, Math.min(11, parseInt(sp.m, 10) - 1)) : now.getMonth();

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, ytot] = await Promise.all([loadAllForMonth(y, m0), getYearlyMonthTotals(y)]);
  const pieData = (() => {
    const m = new Map<string, { name: string; value: number; color?: string }>();
    for (const p of data.superPurchases) {
      const k = p.category.name;
      const c = p.category.color ?? undefined;
      const cur = m.get(k) ?? { name: k, value: 0, color: c };
      cur.value += p.amount;
      if (c) cur.color = c;
      m.set(k, cur);
    }
    return [...m.values()];
  })();

  const byMonth = ytot.byMonth.map((tmo, i) => ({
    name: String(i + 1),
    value: tmo,
  }));

  const monthLabel = `${m0 + 1}/${y}`;
  const dPrev = new Date(y, m0 - 1, 1);
  const dNext = new Date(y, m0 + 1, 1);

  return (
    <div className="mx-auto max-w-5xl p-4 pb-16" dir="rtl">
      <header className="mb-8 flex flex-col gap-3 border-b border-cream-300 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-olive-900">{t.appTitle}</h1>
          <p className="text-sm text-olive-600/90">{session?.user?.name ?? ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-olive-200 bg-cream-50/90 px-3 py-2 text-sm text-olive-800 shadow-sm hover:bg-cream-200/80"
            >
              {t.signOut}
            </button>
          </form>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-medium text-olive-800">
          {t.monthView} · {monthLabel}
        </p>
        <div className="flex gap-2">
          <Link
            className="rounded-lg border border-cream-300 bg-cream-50/90 px-3 py-1.5 text-sm text-olive-800 shadow-sm hover:bg-cream-100"
            href={{ pathname: "/", query: { y: String(dPrev.getFullYear()), m: String(dPrev.getMonth() + 1) } }}
          >
            ←
          </Link>
          <Link
            className="rounded-lg border border-cream-300 bg-cream-50/90 px-3 py-1.5 text-sm text-olive-800 shadow-sm hover:bg-cream-100"
            href={{ pathname: "/", query: { y: String(dNext.getFullYear()), m: String(dNext.getMonth() + 1) } }}
          >
            →
          </Link>
          <Link
            className="rounded-lg border border-olive-700 bg-olive-800 px-3 py-1.5 text-sm text-cream-50 shadow-sm hover:bg-olive-900"
            href={{ pathname: "/" }}
          >
            היום
          </Link>
        </div>
      </div>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="סה״כ בנקים" value={nis(data.totalBanks)} hint="אפשר מינוס" />
        <Card title="משכורת החודש" value={nis(data.salaryThisMonth)} hint={data.hasMonthOverride ? "ייחודי לחודש" : "מברירת מחדל"} />
        <Card
          title={t.otherIncomeTitle}
          value={nis(data.otherIncomeTotal)}
          hint={data.otherIncomeTotal > 0 ? t.otherIncomeHint : "—"}
        />
        <Card title={t.totalIncomeMonth} value={nis(data.totalIncomeMonth)} hint="שכר + הכנסות נוספות" />
        <Card title="סה״כ הוצאות החודש" value={nis(data.monthOut)} hint="קבועים+חריגים+סופר" />
        <Card title="צפי בבנק סוף חודש" value={nis(data.endProjection)} hint="יתרות+סה״כ הכנסה−הוצאות" primary />
        <Card title="חוב (מעקב)" value={nis(data.debt)} />
        <Card title={t.incomeAfterDebt} value={nis(data.salaryVsDebt)} hint="סה״כ הכנסה − חוב כולל" />
        <Card title="אחרי כל התשלומים" value={nis(data.surplusOnSalary)} hint="סה״כ הכנסה − הוצאות" />
      </section>

      <section className="mb-8 rounded-2xl border border-cream-300 bg-cream-50/90 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-olive-800">{t.settings}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <form action={formDefaultSalary} className="space-y-1">
            <label className="block text-xs text-olive-600/90">{t.defaultSalary}</label>
            <input
              name="v"
              type="number"
              defaultValue={data.settings.defaultMonthlySalary}
              step="0.01"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
            <button type="submit" className="mt-1 text-xs text-olive-700 hover:underline">
              {t.save}
            </button>
          </form>
          <form action={formTotalDebt} className="space-y-1">
            <label className="block text-xs text-olive-600/90">{t.totalDebt}</label>
            <input
              name="v"
              type="number"
              defaultValue={data.settings.totalDebt}
              step="0.01"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
            <button type="submit" className="mt-1 text-xs text-olive-700 hover:underline">
              {t.save}
            </button>
          </form>
          <form action={formMonthSalary} className="space-y-1">
            <label className="block text-xs text-olive-600/90">{t.monthSalary}</label>
            <input type="hidden" name="y" value={y} />
            <input type="hidden" name="m" value={m0 + 1} />
            <input
              name="a"
              type="number"
              defaultValue={data.salaryThisMonth}
              step="0.01"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
            <button type="submit" className="mt-1 text-xs text-olive-700 hover:underline">
              {t.save}
            </button>
          </form>
        </div>

        <div className="mt-6 border-t border-cream-200 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-olive-800">{t.otherIncomeTitle}</h3>
          <p className="mb-2 text-xs text-olive-600/90">{t.otherIncomeHint}</p>
          <ul className="mb-3 space-y-1">
            {data.monthIncomeEntries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded border border-cream-200 bg-cream-50/80 px-3 py-2 text-sm"
              >
                <span>
                  {e.label ? `${e.label} · ` : ""}
                  {nis(e.amount)}
                </span>
                <form action={formDeleteMonthIncome}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="text-xs text-rose-800 hover:underline">
                    {t.delete}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={formAddMonthIncome} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="y" value={y} />
            <input type="hidden" name="m" value={m0 + 1} />
            <input
              name="label"
              placeholder={t.label}
              className="grow rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder={t.amount}
              className="w-full min-w-[6rem] rounded border border-cream-300 bg-cream-50/80 px-2 py-1 sm:w-36"
            />
            <button
              type="submit"
              className="rounded bg-olive-800 px-3 py-1.5 text-sm text-cream-50 hover:bg-olive-900"
            >
              {t.addOtherIncome}
            </button>
          </form>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-olive-800">{t.bankAccounts}</h2>
        <div className="space-y-2">
          {data.banks.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-2 rounded-xl border border-cream-300 bg-cream-50/80 p-3 sm:flex-row sm:items-end"
            >
              <form action={formBank} className="flex grow flex-col gap-2 sm:flex-row sm:items-end">
                <input type="hidden" name="id" value={b.id} />
                <div>
                  <label className="text-xs text-olive-600/90">{t.accountName}</label>
                  <input
                    name="name"
                    defaultValue={b.name}
                    className="block w-full min-w-32 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-olive-600/90">{t.currentBalance}</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={b.balance}
                    className="block w-full min-w-28 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                  />
                </div>
                <button type="submit" className="rounded bg-cream-200/80 px-3 py-1 text-sm text-olive-800 hover:bg-cream-200">
                  {t.save}
                </button>
              </form>
              <form action={formDeleteBank}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="text-sm text-rose-800 hover:underline">
                  {t.delete}
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action={formBank} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <input
              name="name"
              placeholder={t.addAccount}
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
          </div>
          <div>
            <input
              name="balance"
              type="number"
              defaultValue="0"
              step="0.01"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
          </div>
          <input type="hidden" name="id" value="" />
          <button type="submit" className="rounded bg-olive-800 px-3 py-1.5 text-sm text-cream-50 shadow-sm hover:bg-olive-900">
            {t.addAccount}
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-olive-800">{t.fixedPayments}</h2>
        <p className="mb-3 text-xs text-olive-600/90">{t.fixedEditHint}</p>
        <ul className="mb-4 space-y-4">
          {data.allFixed.map((f) => {
            const inView = isFixedActiveInMonth(f, y, m0);
            const vf = monthIndexFromValidFrom(f.validFrom);
            const startM1 = vf.month0 + 1;
            const endNote =
              f.endYear != null && f.endMonth != null ? ` · עד ${f.endMonth}/${f.endYear}` : "";
            const monthsNote = f.totalMonths != null ? ` · ${f.totalMonths} חודשים` : "";
            return (
              <li key={f.id} className="rounded-xl border border-cream-300 bg-cream-50/90 p-3 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-olive-700">
                  <span>
                    {f.label} — יום {f.dayOfMonth} — {nis(f.amount)}
                    {monthsNote}
                    {endNote}
                  </span>
                  {!inView ? (
                    <span className="rounded bg-olive-200/60 px-2 py-0.5 text-olive-900">{t.fixedNotThisMonth}</span>
                  ) : null}
                </div>
                <form action={formUpdateFixed} className="space-y-2">
                  <input type="hidden" name="id" value={f.id} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] text-olive-600/90">{t.label}</label>
                      <input
                        name="label"
                        defaultValue={f.label}
                        required
                        className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-olive-600/90">{t.amount}</label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={f.amount}
                        required
                        className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-olive-600/90">{t.dayOfMonth}</label>
                      <input
                        name="day"
                        type="number"
                        min={1}
                        max={31}
                        defaultValue={f.dayOfMonth}
                        className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-olive-600/90">{t.fixedStartsFrom}</label>
                      <div className="flex gap-1">
                        <input
                          name="startYear"
                          type="number"
                          defaultValue={vf.year}
                          className="w-full min-w-0 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                        />
                        <input
                          name="startMonth"
                          type="number"
                          min={1}
                          max={12}
                          defaultValue={startM1}
                          className="w-full min-w-0 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-olive-600/90">{t.fixedNumMonths}</label>
                      <input
                        name="numMonths"
                        type="number"
                        min={1}
                        placeholder="—"
                        defaultValue={f.totalMonths ?? ""}
                        className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-olive-600/90">{t.fixedEndAt}</label>
                      <div className="flex gap-1">
                        <input
                          name="endYear"
                          type="number"
                          placeholder="שנה"
                          defaultValue={f.endYear ?? ""}
                          className="w-full min-w-0 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                        />
                        <input
                          name="endMonth"
                          type="number"
                          min={1}
                          max={12}
                          placeholder="חודש"
                          defaultValue={f.endMonth ?? ""}
                          className="w-full min-w-0 rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded bg-olive-800 px-2 py-1.5 text-sm text-cream-50 hover:bg-olive-900"
                      >
                        {t.fixedSaveChanges}
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-2 flex flex-wrap gap-2 border-t border-cream-200 pt-2">
                  <form action={formCloseFixedThisMonth} className="inline">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="y" value={y} />
                    <input type="hidden" name="m" value={m0 + 1} />
                    <button
                      type="submit"
                      className="rounded border border-olive-300 bg-cream-100 px-2 py-1 text-xs text-olive-800 hover:bg-cream-200"
                    >
                      {t.fixedEndThisViewMonth}
                    </button>
                  </form>
                  <form action={formDeleteFixed} className="inline">
                    <input type="hidden" name="id" value={f.id} />
                    <button type="submit" className="text-xs text-rose-800 hover:underline">
                      {t.delete} (לגמרי)
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mb-1 text-xs font-medium text-olive-700">{t.addFixed}</p>
        <form action={formAddFixed} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <input type="hidden" name="startYear" value={y} />
          <input type="hidden" name="startMonth" value={m0 + 1} />
          <input
            name="label"
            placeholder={t.label}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1 lg:col-span-2"
            required
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder={t.amount}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            required
          />
          <input
            name="day"
            type="number"
            min={1}
            max={31}
            defaultValue="1"
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <input
            name="numMonths"
            type="number"
            min={1}
            placeholder={t.fixedNumMonths}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <div className="flex gap-1 lg:col-span-2">
            <input
              name="endYear"
              type="number"
              placeholder="סיום שנה"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
            <input
              name="endMonth"
              type="number"
              min={1}
              max={12}
              placeholder="חודש"
              className="w-full rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-olive-800 py-1.5 text-sm text-cream-50 hover:bg-olive-900 lg:col-span-2"
          >
            {t.addFixed}
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-olive-800">
          {t.extraPayments} ({monthLabel})
        </h2>
        <ul className="mb-2 space-y-1">
          {data.extras.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded border border-cream-200 bg-cream-50/80 px-3 py-2 text-sm"
            >
              <span>
                {e.label} · {e.paidOn.toLocaleDateString("he-IL")} · {nis(e.amount)}
              </span>
              <form action={formDeleteExtra}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="text-rose-800 hover:underline">
                  {t.delete}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={formAddExtra} className="grid gap-2 sm:grid-cols-4 sm:items-end">
          <input
            name="label"
            placeholder={t.label}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            required
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <input
            name="date"
            type="date"
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            required
            defaultValue={new Date(y, m0, 15).toISOString().slice(0, 10)}
          />
          <button type="submit" className="rounded bg-olive-800 py-1.5 text-sm text-cream-50 hover:bg-olive-900">
            {t.addExtra}
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-olive-800">
          {t.superPurchases} ({monthLabel})
        </h2>
        <h3 className="mb-1 text-xs text-olive-600/90">{t.category}</h3>
        <ul className="mb-2 flex flex-wrap gap-1">
          {data.categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1 rounded-full border border-cream-300 bg-cream-100/80 pl-1 pr-2 text-xs text-olive-800"
              style={c.color ? { borderColor: c.color } : {}}
            >
              {c.name}
              <form action={formDeleteCategory} className="inline">
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-rose-800" aria-label="remove">
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={formAddCategory} className="mb-4 flex flex-wrap gap-2 sm:items-end">
          <input
            name="name"
            placeholder={t.addCategory}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <input name="color" type="color" className="h-8 w-12 rounded border border-cream-300" defaultValue="#6b7a52" />
          <button
            type="submit"
            className="rounded bg-cream-200/90 px-2 py-1 text-sm text-olive-800 hover:bg-cream-200"
          >
            {t.addCategory}
          </button>
        </form>
        <ul className="mb-2 space-y-1">
          {data.superPurchases.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded border border-cream-200 bg-cream-50/80 px-3 py-2 text-sm"
            >
              <span>
                {p.category.name} · {p.boughtOn.toLocaleDateString("he-IL")} · {nis(p.amount)}
                {p.description ? ` · ${p.description}` : ""}
              </span>
              <form action={formDeleteSuper}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-rose-800 hover:underline">
                  {t.delete}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={formAddSuper} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <select
            name="categoryId"
            required
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1.5"
          >
            <option value="">—</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder={t.amount}
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <input
            name="description"
            placeholder="הערה"
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
          />
          <input
            name="date"
            type="date"
            className="rounded border border-cream-300 bg-cream-50/80 px-2 py-1"
            required
            defaultValue={new Date(y, m0, 15).toISOString().slice(0, 10)}
          />
          <button
            type="submit"
            className="rounded bg-olive-800 py-1.5 text-sm text-cream-50 sm:col-span-2 hover:bg-olive-900 lg:col-span-4"
          >
            {t.addPurchase}
          </button>
        </form>
      </section>

      <section className="mb-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-cream-300 bg-cream-50/90 p-4 shadow-sm">
          <SuperPie data={pieData} title={t.chartByCategory} />
        </div>
        <div className="rounded-2xl border border-cream-300 bg-cream-50/90 p-4 shadow-sm">
          <YearBars byMonth={byMonth} yearLabel={String(y)} />
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, hint, primary }: { title: string; value: string; hint?: string; primary?: boolean }) {
  return (
    <div
      className={
        primary
          ? "rounded-2xl border-2 border-olive-800 bg-olive-800 p-4 text-cream-50 shadow-md"
          : "rounded-2xl border border-cream-300 bg-cream-50/90 p-4 shadow-sm"
      }
    >
      <p className="text-xs opacity-85">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs opacity-70">{hint}</p> : null}
    </div>
  );
}
