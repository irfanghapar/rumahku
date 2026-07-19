"use client";

import Link from "next/link";
import { PageHeader, StatCard } from "@/components/ui";
import { fmtDate, fmtRM, todayISO, daysBetween } from "@/lib/format";
import { useStore } from "@/lib/store";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 19) return "Selamat petang";
  return "Selamat malam";
}

export default function Dashboard() {
  const { state } = useStore();
  const today = todayISO();

  const totalOutstanding = state.invoices.reduce((s, i) => s + i.balance, 0);
  const overdue = state.invoices
    .filter((i) => i.balance > 0 && daysBetween(i.dueDate, today) > 0)
    .reduce((s, i) => s + i.balance, 0);
  const collectedThisMonth = state.receipts
    .filter((r) => r.date.slice(0, 7) === today.slice(0, 7))
    .reduce((s, r) => s + r.amount, 0);
  const occupiedLots = new Set(
    state.owners.filter((o) => o.status === "Active").flatMap((o) => o.lotIds)
  );

  const debtors = state.lots
    .map((lot) => ({
      lot,
      due: state.invoices
        .filter((i) => i.lotId === lot.id)
        .reduce((s, i) => s + i.balance, 0),
    }))
    .filter((d) => d.due > 0.004)
    .sort((a, b) => b.due - a.due)
    .slice(0, 6);

  const recent = [
    ...state.receipts.map((r) => ({
      date: r.date,
      docNum: r.docNum,
      lotId: r.lotId,
      desc: "Payment received",
      amount: r.amount,
      kind: "credit" as const,
    })),
    ...state.invoices.map((i) => ({
      date: i.date,
      docNum: i.docNum,
      lotId: i.lotId,
      desc: i.description,
      amount: i.amount,
      kind: "debit" as const,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div>
      {/* hero — MyUnitManager style dark card */}
      <div className="relative mb-5 overflow-hidden rounded-3xl bg-clay-500 p-5 text-white shadow-raised sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(159,232,112,0.25) 0%, rgba(159,232,112,0) 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-lime-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-lime-400">
              {state.settings.propertyCode} · {fmtDate(today)}
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              {greeting()}, Admin
            </h1>
            <p className="mt-0.5 text-sm text-clay-100/70">
              {state.settings.propertyName}
            </p>
            <p className="mt-4 text-[11.5px] text-clay-100/60">
              Outstanding across {debtors.length} lots
            </p>
            <p className="text-3xl font-bold tracking-tight text-lime-400">
              {fmtRM(totalOutstanding)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400 px-3.5 py-1.5 text-xs font-bold text-limeink">
              ↓ {fmtRM(collectedThisMonth)} collected this month
            </span>
            <Link
              href="/receipts"
              className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/40 px-3.5 py-1.5 text-xs font-bold text-lime-300 hover:bg-lime-400/10"
            >
              Record a payment →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={fmtRM(collectedThisMonth)}
          hint={`${state.receipts.length} receipts to date`}
          tone="good"
        />
        <StatCard
          label="Total outstanding"
          value={fmtRM(totalOutstanding)}
          hint="All unpaid billed items"
        />
        <StatCard
          label="Overdue"
          value={fmtRM(overdue)}
          hint="Past due date"
          tone="bad"
        />
        <StatCard
          label="Occupied lots"
          value={`${occupiedLots.size} / ${state.lots.length}`}
          hint={`${state.owners.filter((o) => o.status === "Active").length} active owners`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-ink">Recent activity</h2>
            <Link
              href="/accounts/ledger"
              className="text-xs font-bold text-clay-500 hover:underline"
            >
              View ledger →
            </Link>
          </div>
          <table className="w-full">
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="td w-24 whitespace-nowrap text-soot/70">
                    {fmtDate(r.date)}
                  </td>
                  <td className="td">
                    <p className="font-medium">{r.desc}</p>
                    <p className="text-xs text-soot/60">
                      {r.lotId} · {r.docNum}
                    </p>
                  </td>
                  <td
                    className={`td text-right font-semibold ${r.kind === "credit" ? "text-sage-600" : "text-ink"}`}
                  >
                    {r.kind === "credit" ? "− " : ""}
                    {fmtRM(r.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-ink">Top debtors</h2>
            <Link
              href="/accounts/outstanding"
              className="text-xs font-bold text-clay-500 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="px-5 py-3">
            {debtors.length === 0 && (
              <p className="py-6 text-center text-sm text-soot/60">
                No outstanding balances 🎉
              </p>
            )}
            {debtors.map(({ lot, due }) => {
              const owner = state.owners.find((o) => o.lotIds.includes(lot.id));
              const max = debtors[0]?.due ?? 1;
              return (
                <div key={lot.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink">{lot.id}</span>{" "}
                      <span className="text-xs text-soot/60">
                        {owner?.name ?? "Vacant"}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold text-ink">
                      {fmtRM(due)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-cream">
                    <div
                      className="h-1.5 rounded-full bg-lime-400"
                      style={{ width: `${Math.max(8, (due / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:gap-4 lg:mt-6 lg:grid-cols-3">
        {[
          {
            href: "/billing/monthly",
            title: "Run monthly billing",
            desc: "Generate service charge & sinking fund invoices for all lots.",
          },
          {
            href: "/receipts",
            title: "Record a payment",
            desc: "Issue an official receipt and allocate against outstanding items.",
          },
          {
            href: "/accounts/outstanding",
            title: "Chase arrears",
            desc: "Review aging, apply late payment interest to overdue accounts.",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card group p-5 transition-shadow hover:shadow-raised"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">{c.title}</h3>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400 text-limeink transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </div>
            <p className="mt-1 text-sm text-soot/70">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
