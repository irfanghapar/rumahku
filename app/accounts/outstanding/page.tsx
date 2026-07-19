"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { daysBetween, fmtDate, fmtRM, todayISO } from "@/lib/format";
import { computeLPI, useStore } from "@/lib/store";

export default function OutstandingPage() {
  const { state, dispatch } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [applied, setApplied] = useState<number | null>(null);
  const today = todayISO();

  const rows = useMemo(() => {
    return state.lots
      .map((lot) => {
        const items = state.invoices
          .filter((i) => i.lotId === lot.id && i.balance > 0.004)
          .sort((a, b) => a.date.localeCompare(b.date));
        const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
        for (const inv of items) {
          const overdue = daysBetween(inv.dueDate, today);
          if (overdue <= 0) buckets.current += inv.balance;
          else if (overdue <= 30) buckets.d30 += inv.balance;
          else if (overdue <= 60) buckets.d60 += inv.balance;
          else buckets.d90 += inv.balance;
        }
        const total = items.reduce((s, i) => s + i.balance, 0);
        const owner = state.owners.find(
          (o) => o.status === "Active" && o.lotIds.includes(lot.id)
        );
        return { lot, owner, items, buckets, total };
      })
      .filter((r) => r.total > 0.004)
      .sort((a, b) => b.total - a.total);
  }, [state, today]);

  const grand = rows.reduce((s, r) => s + r.total, 0);
  const lpiPreview = useMemo(() => computeLPI(state), [state]);

  function applyLPI() {
    if (lpiPreview.length === 0) return;
    dispatch({ type: "postInvoices", docType: "IA", lines: lpiPreview });
    setApplied(lpiPreview.length);
    setTimeout(() => setApplied(null), 4000);
  }

  return (
    <div>
      <PageHeader
        title="Account Outstanding"
        subtitle="Aging of unpaid charges across all lots"
        actions={
          <button
            className="btn-primary"
            onClick={applyLPI}
            disabled={lpiPreview.length === 0}
          >
            Apply late payment interest ({lpiPreview.length})
          </button>
        }
      />

      {applied !== null && (
        <div className="mb-4 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ {applied} LPI charges posted at {state.settings.lpiRatePct}% p.a.
          after {state.settings.lpiGraceDays}-day grace.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-soot/60">
            Total Due
          </p>
          <p className="mt-1 font-display text-xl font-bold text-danger-600">
            {fmtRM(grand)}
          </p>
        </div>
        {(
          [
            ["Current", rows.reduce((s, r) => s + r.buckets.current, 0), "good"],
            ["1–30 days", rows.reduce((s, r) => s + r.buckets.d30, 0), "warn"],
            ["31–60 days", rows.reduce((s, r) => s + r.buckets.d60, 0), "warn"],
            ["60+ days", rows.reduce((s, r) => s + r.buckets.d90, 0), "bad"],
          ] as const
        ).map(([label, val]) => (
          <div key={label} className="card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-soot/60">
              {label}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink">
              {fmtRM(val)}
            </p>
          </div>
        ))}
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th w-8" />
              <th className="th">Lot Num</th>
              <th className="th">Owner</th>
              <th className="th text-right">Current</th>
              <th className="th text-right">1–30</th>
              <th className="th text-right">31–60</th>
              <th className="th text-right">60+</th>
              <th className="th text-right">Total Due</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.lot.id}>
                <tr
                  className="cursor-pointer border-b border-line/60 hover:bg-cream/40"
                  onClick={() =>
                    setExpanded(expanded === r.lot.id ? null : r.lot.id)
                  }
                >
                  <td className="td text-soot/40">
                    {expanded === r.lot.id ? "▾" : "▸"}
                  </td>
                  <td className="td font-semibold">{r.lot.id}</td>
                  <td className="td">{r.owner?.name ?? "Vacant"}</td>
                  <td className="td text-right">{r.buckets.current ? fmtRM(r.buckets.current).replace("RM ", "") : "—"}</td>
                  <td className="td text-right">{r.buckets.d30 ? fmtRM(r.buckets.d30).replace("RM ", "") : "—"}</td>
                  <td className="td text-right">{r.buckets.d60 ? fmtRM(r.buckets.d60).replace("RM ", "") : "—"}</td>
                  <td className="td text-right text-danger-600">{r.buckets.d90 ? fmtRM(r.buckets.d90).replace("RM ", "") : "—"}</td>
                  <td className="td text-right font-display font-bold text-danger-600">
                    {fmtRM(r.total)}
                  </td>
                  <td className="td text-right">
                    <Link
                      href="/receipts"
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Receive
                    </Link>
                  </td>
                </tr>
                {expanded === r.lot.id && (
                  <tr className="border-b border-line/60 bg-cream/30">
                    <td />
                    <td colSpan={8} className="px-4 py-3">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="th !py-1.5">Date</th>
                            <th className="th !py-1.5">Due</th>
                            <th className="th !py-1.5">Doc Num</th>
                            <th className="th !py-1.5">GL Code</th>
                            <th className="th !py-1.5">Description</th>
                            <th className="th !py-1.5 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.items.map((inv) => (
                            <tr key={inv.id}>
                              <td className="td !py-1.5">{fmtDate(inv.date)}</td>
                              <td className="td !py-1.5">
                                {fmtDate(inv.dueDate)}{" "}
                                {daysBetween(inv.dueDate, today) > 0 && (
                                  <Badge tone="bad">
                                    {daysBetween(inv.dueDate, today)}d late
                                  </Badge>
                                )}
                              </td>
                              <td className="td !py-1.5 text-soot/70">
                                {inv.docNum}
                              </td>
                              <td className="td !py-1.5">{inv.code}</td>
                              <td className="td !py-1.5">{inv.description}</td>
                              <td className="td !py-1.5 text-right font-semibold">
                                {fmtRM(inv.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
