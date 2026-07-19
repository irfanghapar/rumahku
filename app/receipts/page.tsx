"use client";

import { useMemo, useState } from "react";
import { Badge, Field, PageHeader } from "@/components/ui";
import { fmtDate, fmtRM, todayISO } from "@/lib/format";
import { outstandingForLot, useStore } from "@/lib/store";
import { Receipt } from "@/lib/types";

export default function ReceiptsPage() {
  const { state, dispatch } = useStore();
  const [lotId, setLotId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState<Receipt["mode"]>("Online Banking");
  const [refNum, setRefNum] = useState("");
  const [amount, setAmount] = useState("");
  const [manualNum, setManualNum] = useState("");
  const [issueTo, setIssueTo] = useState<"Owner" | "Tenant">("Owner");
  const [bankCode, setBankCode] = useState("OR1 — Maybank");
  const [itemDesc, setItemDesc] = useState("PAYMENT RECEIPT");
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);

  const BANK_CODES = [
    "OR1 — Maybank",
    "OR2 — CIMB",
    "OR3 — Public Bank",
    "CASH — Cash in hand",
  ];

  const owner = state.owners.find(
    (o) => o.status === "Active" && o.lotIds.includes(lotId)
  );
  const outstanding = useMemo(
    () => (lotId ? outstandingForLot(state, lotId) : []),
    [state, lotId]
  );

  const amt = parseFloat(amount) || 0;
  const allocated = Object.values(alloc).reduce(
    (s, v) => s + (parseFloat(v) || 0),
    0
  );
  const unallocated = Math.round((amt - allocated) * 100) / 100;

  function fifo() {
    let remaining = amt;
    const next: Record<string, string> = {};
    for (const inv of outstanding) {
      if (remaining <= 0) break;
      const take = Math.min(inv.balance, remaining);
      if (take > 0) {
        next[inv.id] = take.toFixed(2);
        remaining = Math.round((remaining - take) * 100) / 100;
      }
    }
    setAlloc(next);
  }

  function save() {
    if (!lotId || amt <= 0 || unallocated !== 0) return;
    const allocations = Object.entries(alloc)
      .map(([invoiceId, v]) => ({ invoiceId, amount: parseFloat(v) || 0 }))
      .filter((a) => a.amount > 0);
    const remarks = allocations
      .map((a) => {
        const inv = state.invoices.find((i) => i.id === a.invoiceId)!;
        return `${inv.code}-${inv.docNum}(RM${a.amount.toFixed(2)})`;
      })
      .join(" ");
    dispatch({
      type: "postReceipt",
      lotId,
      date,
      mode,
      refNum,
      amount: amt,
      allocations,
      remarks: `BEING PAYMENT FOR ${remarks}`,
    });
    setAlloc({});
    setAmount("");
    setRefNum("");
    // receipt docNum was generated inside the reducer; reconstruct for display
    const docNum = `OR-${String(10000000 + state.seq.OR).slice(1)}`;
    setLastReceipt({
      id: docNum,
      docNum,
      lotId,
      date,
      mode,
      refNum,
      amount: amt,
      allocations,
      remarks: `BEING PAYMENT FOR ${remarks}`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Official Receipt"
        subtitle="Record a payment and allocate it against outstanding items"
        actions={
          lastReceipt && (
            <button className="btn-secondary" onClick={() => window.print()}>
              🖨 Print last receipt
            </button>
          )
        }
      />

      <div className="no-print">
        <div className="card mb-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Lot Num">
              <select
                className="input"
                value={lotId}
                onChange={(e) => {
                  setLotId(e.target.value);
                  setAlloc({});
                }}
              >
                <option value="">Select lot…</option>
                {[...state.lots]
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((l) => (
                    <option key={l.id}>{l.id}</option>
                  ))}
              </select>
            </Field>
            <Field label="Received From">
              <input
                className="input"
                value={owner?.name ?? (lotId ? "Vacant lot" : "")}
                disabled
              />
            </Field>
            <Field label="Issue To">
              <select
                className="input"
                value={issueTo}
                onChange={(e) => setIssueTo(e.target.value as "Owner" | "Tenant")}
              >
                <option>Owner</option>
                <option>Tenant</option>
              </select>
            </Field>
            <Field label="Date Trnx">
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Manual Num">
              <input
                className="input"
                placeholder="optional"
                value={manualNum}
                onChange={(e) => setManualNum(e.target.value)}
              />
            </Field>
            <Field label="Payment Mode">
              <select
                className="input"
                value={mode}
                onChange={(e) => setMode(e.target.value as Receipt["mode"])}
              >
                <option>Online Banking</option>
                <option>JomPAY</option>
                <option>Cash</option>
                <option>Cheque</option>
                <option>Credit Card</option>
              </select>
            </Field>
            <Field label="Bank Code">
              <select
                className="input"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              >
                {BANK_CODES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Cheque / Ref Num">
              <input
                className="input"
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
              />
            </Field>
            <Field label="Amount (RM)">
              <input
                className="input text-right font-semibold"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Item Description" className="sm:col-span-2 lg:col-span-4">
              <input
                className="input"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value.toUpperCase())}
              />
            </Field>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
              <button
                className="btn-secondary"
                onClick={fifo}
                disabled={!lotId || amt <= 0}
              >
                FIFO Auto-allocate
              </button>
              <button
                className="btn-secondary"
                onClick={() => setAlloc({})}
                disabled={Object.keys(alloc).length === 0}
              >
                Un-apply All
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-cream px-4 py-2.5 text-sm">
            <span>
              Target Balance:{" "}
              <span className="font-semibold text-ink">
                {fmtRM(outstanding.reduce((s, i) => s + i.balance, 0))}
              </span>
            </span>
            <span>
              Allocated:{" "}
              <span className="font-semibold text-ink">{fmtRM(allocated)}</span>
            </span>
            <span>
              Unallocated:{" "}
              <span
                className={
                  "font-semibold " +
                  (unallocated === 0 ? "text-sage-600" : "text-danger-600")
                }
              >
                {fmtRM(unallocated)}
              </span>
            </span>
            <button
              className="btn-primary ml-auto"
              onClick={save}
              disabled={!lotId || amt <= 0 || unallocated !== 0 || allocated <= 0}
            >
              Save Receipt
            </button>
          </div>
        </div>

        {lotId && (
          <div className="table-card">
            <div className="border-b border-line px-5 py-3">
              <h2 className="text-sm font-bold text-ink">
                Outstanding items — {lotId}
              </h2>
            </div>
            {outstanding.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-soot/60">
                Nothing outstanding for this lot 🎉
              </p>
            ) : (
              <table className="w-full">
                <thead className="border-b border-line bg-cream/60">
                  <tr>
                    <th className="th">Date Trnx</th>
                    <th className="th">Doc Num</th>
                    <th className="th">GL Code</th>
                    <th className="th">Item Description</th>
                    <th className="th text-right">Amount</th>
                    <th className="th text-right">Item Balance</th>
                    <th className="th w-36 text-right">Allocate</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((inv) => (
                    <tr key={inv.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                      <td className="td">{fmtDate(inv.date)}</td>
                      <td className="td text-soot/70">{inv.docNum}</td>
                      <td className="td">
                        <Badge tone="neutral">{inv.code}</Badge>
                      </td>
                      <td className="td">{inv.description}</td>
                      <td className="td text-right">{fmtRM(inv.amount)}</td>
                      <td className="td text-right font-semibold">
                        {fmtRM(inv.balance)}
                      </td>
                      <td className="td text-right">
                        <input
                          className="input !w-28 text-right"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={alloc[inv.id] ?? ""}
                          onChange={(e) =>
                            setAlloc({ ...alloc, [inv.id]: e.target.value })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* printable receipt */}
      {lastReceipt && (
        <div className="print-area card mt-6 p-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {state.settings.propertyName} ({state.settings.propertyCode})
              </h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-soot/70">
                {state.settings.address}
                <br />
                Tel: {state.settings.phone} · {state.settings.email}
              </p>
            </div>
            <div className="text-right">
              <h3 className="font-display text-xl font-bold text-ink">
                Official Receipt
              </h3>
              <p className="mt-1 text-sm text-soot/70">
                Receipt No: <span className="font-semibold text-ink">{lastReceipt.docNum}</span>
                <br />
                Date: {fmtDate(lastReceipt.date)}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-soot/50">
                Received From
              </p>
              <p className="mt-0.5 font-semibold text-ink">
                {state.owners.find((o) => o.lotIds.includes(lastReceipt.lotId))
                  ?.name ?? "—"}
              </p>
              <p className="text-soot/70">
                {lastReceipt.lotId} · {state.settings.propertyName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-soot/50">
                The Sum Of
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink">
                {fmtRM(lastReceipt.amount)}
              </p>
              <p className="text-soot/70">
                {lastReceipt.mode}
                {lastReceipt.refNum ? ` · ${lastReceipt.refNum}` : ""}
              </p>
            </div>
          </div>
          <table className="mt-6 w-full">
            <thead className="border-b border-line">
              <tr>
                <th className="th !px-2">Doc Num</th>
                <th className="th !px-2">Description</th>
                <th className="th !px-2 text-right">Allocated</th>
              </tr>
            </thead>
            <tbody>
              {lastReceipt.allocations.map((a) => {
                const inv = state.invoices.find((i) => i.id === a.invoiceId);
                return (
                  <tr key={a.invoiceId} className="border-b border-line/50">
                    <td className="td !px-2 text-soot/70">{inv?.docNum}</td>
                    <td className="td !px-2">{inv?.description}</td>
                    <td className="td !px-2 text-right">{fmtRM(a.amount)}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="td !px-2" colSpan={2}>
                  <span className="font-semibold">Total Allocation</span>
                </td>
                <td className="td !px-2 text-right font-bold text-ink">
                  {fmtRM(lastReceipt.amount)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-6 text-[11px] italic text-soot/50">
            The validity of this receipt is subject to the clearance of the
            cheque. Computer generated — no signature required.
          </p>
        </div>
      )}
    </div>
  );
}
