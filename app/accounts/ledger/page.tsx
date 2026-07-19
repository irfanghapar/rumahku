"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { fmtDate, fmtRM, todayISO } from "@/lib/format";
import { lotLedger, outstandingForLot, useStore } from "@/lib/store";

export default function LedgerPage() {
  const { state } = useStore();
  const [lotId, setLotId] = useState(state.lots[0]?.id ?? "");
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState(todayISO());
  const [scope, setScope] = useState("Combined");
  const [displayByDoc, setDisplayByDoc] = useState(false);
  const [hideVoided, setHideVoided] = useState(false);
  const [consolidateLPI, setConsolidateLPI] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(false);
  const owner = state.owners.find(
    (o) => o.status === "Active" && o.lotIds.includes(lotId)
  );

  const entries = useMemo(
    () => (lotId ? lotLedger(state, lotId) : []),
    [state, lotId]
  );

  // running balance across ALL entries, then window to the date range so the
  // brought-forward balance stays correct.
  let running = 0;
  let opening = 0;
  const withBalance = entries
    .map((e) => {
      running = Math.round((running + e.debit - e.credit) * 100) / 100;
      if (fromDate && e.date < fromDate) opening = running;
      return { ...e, balance: running };
    })
    .filter(
      (e) => (!fromDate || e.date >= fromDate) && (!toDate || e.date <= toDate)
    );

  const totalDebit = withBalance.reduce((s, e) => s + e.debit, 0);
  const totalCredit = withBalance.reduce((s, e) => s + e.credit, 0);
  const closing = withBalance.length
    ? withBalance[withBalance.length - 1].balance
    : opening;
  const outstanding = lotId
    ? outstandingForLot(state, lotId).reduce((s, i) => s + i.balance, 0)
    : 0;

  return (
    <div>
      <PageHeader
        title="Account Ledger"
        subtitle="Full statement of account per lot — debits, credits and running balance"
        actions={
          <button className="btn-secondary" onClick={() => window.print()}>
            🖨 Print statement
          </button>
        }
      />

      <div className="card no-print mb-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label">Lot Num</label>
          <select
            className="input w-40"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
          >
            {[...state.lots]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((l) => (
                <option key={l.id}>{l.id}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="label">Name</label>
          <input
            className="input w-56"
            value={owner?.name ?? "Vacant"}
            disabled
          />
        </div>
        <div>
          <label className="label">From Date</label>
          <input
            type="date"
            className="input w-40"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">To Date</label>
          <input
            type="date"
            className="input w-40"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Owner &amp; Tenant</label>
          <select
            className="input w-32"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option>Combined</option>
            <option>Owner Only</option>
            <option>Tenant Only</option>
          </select>
        </div>
        {owner && <Badge tone="good">Ownership Active</Badge>}
        <p className="ml-auto text-sm">
          Balance:{" "}
          <span
            className={
              "font-display text-lg font-bold " +
              (closing > 0 ? "text-danger-600" : "text-sage-600")
            }
          >
            {fmtRM(closing)}
          </span>
        </p>
      </div>

      <div className="no-print mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-soot/80">
        {(
          [
            ["Display By Document", displayByDoc, setDisplayByDoc],
            ["Do not display voided items", hideVoided, setHideVoided],
            ["Consolidate Monthly LPI", consolidateLPI, setConsolidateLPI],
            ["Include Outstanding Summary", includeSummary, setIncludeSummary],
          ] as [string, boolean, (v: boolean) => void][]
        ).map(([label, val, set]) => (
          <label key={label} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-clay-500"
              checked={val}
              onChange={(e) => set(e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="print-area table-card">
        <div className="hidden border-b border-line px-6 py-4 print:block">
          <h2 className="font-display font-bold text-ink">
            {state.settings.propertyName} — Statement of Account
          </h2>
          <p className="text-xs text-soot/70">
            {lotId} · {owner?.name ?? "Vacant"}
          </p>
        </div>
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Date Trnx</th>
              <th className="th">Doc Num</th>
              <th className="th">Item Description</th>
              <th className="th text-right">Debit</th>
              <th className="th text-right">Credit</th>
              <th className="th text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line/60 bg-cream/30">
              <td className="td" colSpan={5}>
                <span className="font-semibold text-soot/70">BALANCE B/F</span>
              </td>
              <td className="td text-right text-soot/70">
                {fmtRM(opening).replace("RM ", "")}
              </td>
            </tr>
            {withBalance.map((e, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="td text-soot/70">{e.docNum}</td>
                <td className="td">{e.description}</td>
                <td className="td text-right">
                  {e.debit > 0 ? fmtRM(e.debit).replace("RM ", "") : ""}
                </td>
                <td className="td text-right text-sage-600">
                  {e.credit > 0 ? fmtRM(e.credit).replace("RM ", "") : ""}
                </td>
                <td
                  className={
                    "td text-right font-semibold " +
                    (e.balance < 0 ? "text-sage-600" : "")
                  }
                >
                  {fmtRM(e.balance).replace("RM ", "")}
                </td>
              </tr>
            ))}
            <tr className="bg-cream/50">
              <td className="td" colSpan={3}>
                <span className="font-semibold text-ink">Totals</span>
              </td>
              <td className="td text-right font-semibold">
                {fmtRM(totalDebit).replace("RM ", "")}
              </td>
              <td className="td text-right font-semibold text-sage-600">
                {fmtRM(totalCredit).replace("RM ", "")}
              </td>
              <td className="td text-right font-display font-bold text-ink">
                {fmtRM(closing)}
              </td>
            </tr>
            {includeSummary && (
              <tr className="bg-clay-50">
                <td className="td" colSpan={5}>
                  <span className="font-semibold text-clay-700">
                    Outstanding Summary (as at {fmtDate(toDate)})
                  </span>
                </td>
                <td className="td text-right font-display font-bold text-danger-600">
                  {fmtRM(outstanding)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
