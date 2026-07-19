"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import {
  addDays,
  fmtRM,
  monthEndISO,
  monthStartISO,
  fmtNum,
} from "@/lib/format";
import { useStore } from "@/lib/store";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MonthlyBillingPage() {
  const { state, dispatch } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const recurringCodes = state.codes.filter(
    (c) => c.active && c.docType === "IV" && c.frequency !== "One-off"
  );
  const [selected, setSelected] = useState<string[]>(
    recurringCodes.slice(0, 2).map((c) => c.code)
  );
  const [posted, setPosted] = useState<number | null>(null);

  const periodStart = monthStartISO(year, month);
  const periodEnd = monthEndISO(year, month);

  const ownedLotIds = new Set(
    state.owners.filter((o) => o.status === "Active").flatMap((o) => o.lotIds)
  );

  const alreadyBilled = useMemo(() => {
    const set = new Set<string>();
    for (const inv of state.invoices) {
      if (inv.periodStart === periodStart) set.add(`${inv.lotId}|${inv.code}`);
    }
    return set;
  }, [state.invoices, periodStart]);

  const previewLines = useMemo(() => {
    const lines: {
      lotId: string;
      code: string;
      description: string;
      amount: number;
      skipped: boolean;
    }[] = [];
    for (const lot of [...state.lots].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!ownedLotIds.has(lot.id)) continue;
      for (const code of recurringCodes) {
        if (!selected.includes(code.code)) continue;
        const amount =
          code.method === "rate"
            ? Math.round(lot.builtUp * code.rate * 100) / 100
            : code.rate;
        lines.push({
          lotId: lot.id,
          code: code.code,
          description: code.description,
          amount,
          skipped: alreadyBilled.has(`${lot.id}|${code.code}`),
        });
      }
    }
    return lines;
  }, [state.lots, recurringCodes, selected, alreadyBilled, ownedLotIds]);

  const toPost = previewLines.filter((l) => !l.skipped);
  const total = toPost.reduce((s, l) => s + l.amount, 0);

  function post() {
    if (toPost.length === 0) return;
    dispatch({
      type: "postInvoices",
      docType: "IV",
      groupByLot: true,
      lines: toPost.map((l) => ({
        lotId: l.lotId,
        date: periodStart,
        dueDate: addDays(periodStart, state.settings.dueDays),
        code: l.code,
        docType: "IV" as const,
        description: l.description,
        amount: l.amount,
        periodStart,
        periodEnd,
      })),
    });
    setPosted(toPost.length);
    setTimeout(() => setPosted(null), 4000);
  }

  return (
    <div>
      <PageHeader
        title="Monthly Billing Run"
        subtitle="Generate recurring invoices (service charge, sinking fund…) for all owned lots"
        actions={
          <button className="btn-primary" onClick={post} disabled={toPost.length === 0}>
            Post {toPost.length} items to account
          </button>
        }
      />

      {posted !== null && (
        <div className="mb-4 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ Posted {posted} billing items for {MONTHS[month]} {year}. See them in
          the Account Ledger.
        </div>
      )}

      <div className="card no-print mb-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label">Billing Month</label>
          <select
            className="input w-36"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <select
            className="input w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <label className="label">Billing Codes</label>
          <div className="flex flex-wrap gap-2">
            {recurringCodes.map((c) => {
              const on = selected.includes(c.code);
              return (
                <button
                  key={c.code}
                  onClick={() =>
                    setSelected(
                      on
                        ? selected.filter((x) => x !== c.code)
                        : [...selected, c.code]
                    )
                  }
                  className={
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (on
                      ? "border-clay-500 bg-clay-500 text-lime-400"
                      : "border-line bg-paper text-soot hover:bg-cream")
                  }
                >
                  {c.code} · {c.description}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-soot/60">
            Items to post
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {toPost.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-soot/60">
            Already billed (skipped)
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {previewLines.length - toPost.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-soot/60">
            Total value
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {fmtRM(total)}
          </p>
        </div>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Lot Num</th>
              <th className="th">Code</th>
              <th className="th">Description</th>
              <th className="th text-right">Amount</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {previewLines.map((l, i) => (
              <tr
                key={i}
                className={
                  "border-b border-line/60 last:border-0 " +
                  (l.skipped ? "opacity-45" : "hover:bg-cream/40")
                }
              >
                <td className="td font-semibold">{l.lotId}</td>
                <td className="td">{l.code}</td>
                <td className="td">{l.description}</td>
                <td className="td text-right">{fmtNum(l.amount)}</td>
                <td className="td">
                  {l.skipped ? (
                    <Badge tone="neutral">Billed</Badge>
                  ) : (
                    <Badge tone="good">Ready</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
