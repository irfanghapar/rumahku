"use client";

import { Fragment, useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { fmtDate, fmtRM, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function SettlementPage() {
  const { state } = useStore();
  const [lotId, setLotId] = useState(state.lots[0]?.id ?? "");
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState(todayISO());
  const owner = state.owners.find(
    (o) => o.status === "Active" && o.lotIds.includes(lotId)
  );

  const rows = useMemo(() => {
    const invoices = state.invoices
      .filter((i) => i.lotId === lotId)
      .filter(
        (i) => (!fromDate || i.date >= fromDate) && (!toDate || i.date <= toDate)
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    return invoices.map((inv) => {
      const settlements = state.receipts
        .flatMap((r) =>
          r.allocations
            .filter((a) => a.invoiceId === inv.id)
            .map((a) => ({
              receiptNum: r.docNum,
              datePaid: r.date,
              mode: r.mode,
              refNum: r.refNum,
              amountPaid: a.amount,
            }))
        )
        .sort((a, b) => a.datePaid.localeCompare(b.datePaid));
      return { inv, settlements };
    });
  }, [state, lotId, fromDate, toDate]);

  const totalBilled = rows.reduce((s, r) => s + r.inv.amount, 0);
  const totalPaid = rows.reduce(
    (s, r) => s + r.settlements.reduce((x, y) => x + y.amountPaid, 0),
    0
  );
  const totalDue = rows.reduce((s, r) => s + r.inv.balance, 0);

  return (
    <div>
      <PageHeader
        title="Billing & Settlement"
        subtitle="Every billed item matched against the receipt that settled it"
        actions={
          <button className="btn-secondary" onClick={() => window.print()}>
            🖨 Print
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
          <input className="input w-48" value={owner?.name ?? "Vacant"} disabled />
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
        {owner && <Badge tone="good">Ownership Active</Badge>}
        <div className="ml-auto flex flex-wrap gap-5 text-sm">
          <span>
            Billed: <span className="font-bold text-ink">{fmtRM(totalBilled)}</span>
          </span>
          <span>
            Settled:{" "}
            <span className="font-bold text-sage-600">{fmtRM(totalPaid)}</span>
          </span>
          <span>
            Due:{" "}
            <span className="font-bold text-danger-600">{fmtRM(totalDue)}</span>
          </span>
        </div>
      </div>

      <div className="print-area table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Date Trnx</th>
              <th className="th">Due Date</th>
              <th className="th">Doc Num</th>
              <th className="th">Party</th>
              <th className="th">Item Description</th>
              <th className="th text-right">Amount</th>
              <th className="th">Receipt No</th>
              <th className="th">Chequenum</th>
              <th className="th">Date Paid</th>
              <th className="th text-right">Amount Paid</th>
              <th className="th text-right">Item Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ inv, settlements }) => {
              const spans = Math.max(1, settlements.length);
              return (
                <Fragment key={inv.id}>
                  {Array.from({ length: spans }).map((_, i) => {
                    const s = settlements[i];
                    return (
                      <tr
                        key={i}
                        className="border-b border-line/60 hover:bg-cream/40"
                      >
                        {i === 0 ? (
                          <>
                            <td className="td whitespace-nowrap">
                              {fmtDate(inv.date)}
                            </td>
                            <td className="td whitespace-nowrap text-soot/70">
                              {fmtDate(inv.dueDate)}
                            </td>
                            <td className="td text-soot/70">{inv.docNum}</td>
                            <td className="td text-soot/70">OWN</td>
                            <td className="td">
                              <span className="mr-2">{inv.description}</span>
                              <Badge tone="neutral">{inv.code}</Badge>
                            </td>
                            <td className="td text-right">{fmtRM(inv.amount)}</td>
                          </>
                        ) : (
                          <td colSpan={6} />
                        )}
                        {s ? (
                          <>
                            <td className="td text-soot/70">{s.receiptNum}</td>
                            <td className="td text-soot/70">{s.refNum || "—"}</td>
                            <td className="td whitespace-nowrap">
                              {fmtDate(s.datePaid)}
                            </td>
                            <td className="td text-right text-sage-600">
                              {fmtRM(s.amountPaid)}
                            </td>
                          </>
                        ) : (
                          <td colSpan={4} className="td text-center text-soot/40">
                            — unsettled —
                          </td>
                        )}
                        {i === 0 ? (
                          <td
                            className={
                              "td text-right font-semibold " +
                              (inv.balance > 0 ? "text-danger-600" : "")
                            }
                          >
                            {fmtRM(inv.balance)}
                          </td>
                        ) : (
                          <td />
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
            <tr className="bg-cream/50">
              <td className="td" colSpan={5}>
                <span className="font-bold text-ink">Totals</span>
              </td>
              <td className="td text-right font-bold">{fmtRM(totalBilled)}</td>
              <td colSpan={3} />
              <td className="td text-right font-bold text-sage-600">
                {fmtRM(totalPaid)}
              </td>
              <td className="td text-right font-bold text-danger-600">
                {fmtRM(totalDue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
