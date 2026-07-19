"use client";

import { useState } from "react";
import { Field, PageHeader } from "@/components/ui";
import { addDays, fmtRM, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

interface Line {
  code: string;
  description: string;
  amount: string;
}

export default function GeneralBillingPage() {
  const { state, dispatch } = useStore();
  const oneOffCodes = state.codes.filter(
    (c) => c.active && (c.docType === "IV" || c.docType === "DN")
  );

  const [lotId, setLotId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { code: oneOffCodes[0]?.code ?? "", description: "", amount: "" },
  ]);
  const [posted, setPosted] = useState(false);

  const owner = state.owners.find(
    (o) => o.status === "Active" && o.lotIds.includes(lotId)
  );

  const parsed = lines
    .map((l) => {
      const value = parseFloat(l.amount);
      const code = state.codes.find((c) => c.code === l.code);
      const sst =
        code?.taxable && !isNaN(value)
          ? Math.round(value * (state.settings.sstRatePct / 100) * 100) / 100
          : 0;
      return { ...l, value, sst };
    })
    .filter((l) => l.code && !isNaN(l.value) && l.value > 0);
  const totalBase = parsed.reduce((s, l) => s + l.value, 0);
  const totalSst = parsed.reduce((s, l) => s + l.sst, 0);
  const total = Math.round((totalBase + totalSst) * 100) / 100;

  function setLine(i: number, patch: Partial<Line>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function post() {
    if (!lotId || parsed.length === 0) return;
    dispatch({
      type: "postInvoices",
      docType: "IV",
      groupByLot: true,
      lines: parsed.map((l) => {
        const code = state.codes.find((c) => c.code === l.code)!;
        return {
          lotId,
          date,
          dueDate: addDays(date, state.settings.dueDays),
          code: code.code,
          docType: "IV" as const,
          description: l.description || code.description,
          amount: Math.round(l.value * 100) / 100,
        };
      }),
    });
    setPosted(true);
    setLines([{ code: oneOffCodes[0]?.code ?? "", description: "", amount: "" }]);
    setRemarks("");
    setTimeout(() => setPosted(false), 4000);
  }

  return (
    <div>
      <PageHeader
        title="General Billing"
        subtitle="Issue one-off charges — wheel clamping, access cards, renovation deposits…"
        actions={
          <button
            className="btn-primary"
            onClick={post}
            disabled={!lotId || parsed.length === 0}
          >
            Save &amp; Post {total > 0 ? `(${fmtRM(total)})` : ""}
          </button>
        }
      />

      {posted && (
        <div className="mb-4 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ Billing posted to {lotId}. It now appears in the ledger and
          outstanding list.
        </div>
      )}

      <div className="card mb-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Lot Num">
            <select
              className="input"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
            >
              <option value="">Select lot…</option>
              {[...state.lots]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((l) => (
                  <option key={l.id}>{l.id}</option>
                ))}
            </select>
          </Field>
          <Field label="Bill To">
            <input
              className="input"
              value={owner?.name ?? (lotId ? "Vacant lot" : "")}
              disabled
            />
          </Field>
          <Field label="Date Trnx">
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Due Date">
            <input
              className="input"
              value={addDays(date, state.settings.dueDays)
                .split("-")
                .reverse()
                .join("/")}
              disabled
            />
          </Field>
          <Field label="Remarks" className="sm:col-span-2 lg:col-span-4">
            <input
              className="input"
              placeholder="e.g. ILLEGAL PARKING IN CAR PARK 1001"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.toUpperCase())}
            />
          </Field>
        </div>
      </div>

      <div className="table-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-bold text-ink">Billing Items</h2>
          <button
            className="btn-ghost !px-2 !py-1 text-xs"
            onClick={() =>
              setLines([
                ...lines,
                { code: oneOffCodes[0]?.code ?? "", description: "", amount: "" },
              ])
            }
          >
            + Add Item
          </button>
        </div>
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th w-14">Item</th>
              <th className="th w-48">GL Code</th>
              <th className="th">Item Description</th>
              <th className="th w-40 text-right">Amount (RM)</th>
              <th className="th w-14" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0">
                <td className="td text-soot/60">{i + 1}</td>
                <td className="td">
                  <select
                    className="input"
                    value={l.code}
                    onChange={(e) => {
                      const code = state.codes.find(
                        (c) => c.code === e.target.value
                      );
                      setLine(i, {
                        code: e.target.value,
                        amount:
                          code && code.rate > 0 && code.method === "fixed"
                            ? String(code.rate)
                            : l.amount,
                      });
                    }}
                  >
                    {oneOffCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.description}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="td">
                  <input
                    className="input"
                    placeholder="Defaults to code description"
                    value={l.description}
                    onChange={(e) =>
                      setLine(i, { description: e.target.value.toUpperCase() })
                    }
                  />
                </td>
                <td className="td">
                  <input
                    className="input text-right"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={l.amount}
                    onChange={(e) => setLine(i, { amount: e.target.value })}
                  />
                </td>
                <td className="td text-right">
                  {lines.length > 1 && (
                    <button
                      className="text-soot/40 hover:text-clay-600"
                      onClick={() =>
                        setLines(lines.filter((_, idx) => idx !== i))
                      }
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {totalSst > 0 && (
              <>
                <tr className="bg-cream/30">
                  <td className="td text-right text-soot/70" colSpan={3}>
                    Subtotal
                  </td>
                  <td className="td text-right text-soot/80">
                    {fmtRM(totalBase)}
                  </td>
                  <td />
                </tr>
                <tr className="bg-cream/30">
                  <td className="td text-right text-soot/70" colSpan={3}>
                    SST {state.settings.sstRatePct}%
                  </td>
                  <td className="td text-right text-soot/80">
                    {fmtRM(totalSst)}
                  </td>
                  <td />
                </tr>
              </>
            )}
            <tr className="bg-cream/50">
              <td className="td" colSpan={3}>
                <span className="font-semibold text-ink">
                  Total Amount {totalSst > 0 ? "(incl. SST)" : ""}
                </span>
              </td>
              <td className="td text-right font-display text-base font-bold text-ink">
                {fmtRM(total)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
