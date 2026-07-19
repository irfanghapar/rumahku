"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { addDays, fmtDate, fmtRM, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function DepositsPage() {
  const { state, dispatch } = useStore();
  const [lotId, setLotId] = useState("All");
  const [billed, setBilled] = useState(false);

  const rows = useMemo(() => {
    return state.invoices
      .filter((i) => i.docType === "DN")
      .filter((i) => (lotId === "All" ? true : i.lotId === lotId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((inv) => {
        const paid = state.receipts
          .flatMap((r) =>
            r.allocations
              .filter((a) => a.invoiceId === inv.id)
              .map((a) => ({ receipt: r, amount: a.amount }))
          )
          .sort((a, b) => a.receipt.date.localeCompare(b.receipt.date));
        const received = paid.reduce((s, p) => s + p.amount, 0);
        const refunds = state.vouchers.filter((v) => v.invoiceId === inv.id);
        const refunded = refunds.reduce((s, v) => s + v.amount, 0);
        const retained = Math.round((received - refunded) * 100) / 100;
        const owner = state.owners.find(
          (o) => o.status === "Active" && o.lotIds.includes(inv.lotId)
        );
        return { inv, owner, paid, received, refunds, refunded, retained };
      });
  }, [state, lotId]);

  const totals = rows.reduce(
    (t, r) => ({
      received: t.received + r.received,
      refunded: t.refunded + r.refunded,
      retained: t.retained + r.retained,
    }),
    { received: 0, refunded: 0, retained: 0 }
  );

  function billDeposit(targetLot: string) {
    const code = state.codes.find((c) => c.code === "DNRNV");
    if (!code || !targetLot || targetLot === "All") return;
    const today = todayISO();
    dispatch({
      type: "postInvoices",
      docType: "DN",
      groupByLot: true,
      lines: [
        {
          lotId: targetLot,
          date: today,
          dueDate: addDays(today, state.settings.dueDays),
          code: code.code,
          docType: "DN",
          description: code.description,
          amount: code.rate,
        },
      ],
    });
    setBilled(true);
    setTimeout(() => setBilled(false), 3500);
  }

  function refund(invoiceId: string) {
    dispatch({
      type: "refundDeposit",
      invoiceId,
      date: todayISO(),
      mode: "Online Banking",
      refNum: "",
    });
  }

  return (
    <div>
      <PageHeader
        title="Deposit Statement"
        subtitle="Renovation & other deposits — billed, received, refunded, retained"
        actions={
          <button
            className="btn-primary"
            onClick={() => billDeposit(lotId)}
            disabled={lotId === "All"}
          >
            + Bill deposit to {lotId === "All" ? "lot…" : lotId}
          </button>
        }
      />

      {billed && (
        <div className="mb-4 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ Renovation deposit billed. Collect it via Official Receipt.
        </div>
      )}

      <div className="card no-print mb-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label">Lot Num</label>
          <select
            className="input w-40"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
          >
            <option>All</option>
            {[...state.lots]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((l) => (
                <option key={l.id}>{l.id}</option>
              ))}
          </select>
        </div>
        <div className="ml-auto flex flex-wrap gap-5 text-sm">
          <span>
            Received:{" "}
            <span className="font-bold text-ink">{fmtRM(totals.received)}</span>
          </span>
          <span>
            Refunded:{" "}
            <span className="font-bold text-sage-600">
              {fmtRM(totals.refunded)}
            </span>
          </span>
          <span>
            Retained:{" "}
            <span className="font-bold text-clay-500">
              {fmtRM(totals.retained)}
            </span>
          </span>
        </div>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Date Trnx</th>
              <th className="th">Doc Num</th>
              <th className="th">Lot / Owner</th>
              <th className="th">Item Description</th>
              <th className="th text-right">Amount</th>
              <th className="th">Paid Via</th>
              <th className="th">Refund Via</th>
              <th className="th text-right">Received</th>
              <th className="th text-right">Refunded</th>
              <th className="th text-right">Retained</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="td py-10 text-center text-soot/50">
                  No deposits billed yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.inv.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td whitespace-nowrap">{fmtDate(r.inv.date)}</td>
                <td className="td text-soot/70">{r.inv.docNum}</td>
                <td className="td">
                  <p className="font-semibold">{r.inv.lotId}</p>
                  <p className="text-xs text-soot/60">{r.owner?.name ?? "Vacant"}</p>
                </td>
                <td className="td">{r.inv.description}</td>
                <td className="td text-right">{fmtRM(r.inv.amount)}</td>
                <td className="td">
                  {r.paid.length === 0 ? (
                    <Badge tone="warn">Unpaid</Badge>
                  ) : (
                    r.paid.map((p, i) => (
                      <p key={i} className="text-xs text-soot/70">
                        {p.receipt.docNum} · {fmtDate(p.receipt.date)}
                      </p>
                    ))
                  )}
                </td>
                <td className="td">
                  {r.refunds.length === 0 ? (
                    <span className="text-soot/40">—</span>
                  ) : (
                    r.refunds.map((v) => (
                      <p key={v.id} className="text-xs text-soot/70">
                        {v.docNum} · {fmtDate(v.date)}
                      </p>
                    ))
                  )}
                </td>
                <td className="td text-right">{fmtRM(r.received)}</td>
                <td className="td text-right text-sage-600">
                  {r.refunded ? fmtRM(r.refunded) : "—"}
                </td>
                <td className="td text-right font-semibold">
                  {fmtRM(r.retained)}
                </td>
                <td className="td text-right">
                  {r.retained > 0 && (
                    <button
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => refund(r.inv.id)}
                    >
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-cream/50">
              <td className="td" colSpan={7}>
                <span className="font-bold text-ink">Totals</span>
              </td>
              <td className="td text-right font-bold">{fmtRM(totals.received)}</td>
              <td className="td text-right font-bold text-sage-600">
                {fmtRM(totals.refunded)}
              </td>
              <td className="td text-right font-bold text-ink">
                {fmtRM(totals.retained)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
