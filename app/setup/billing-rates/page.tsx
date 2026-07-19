"use client";

import { useMemo, useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { fmtNum, fmtRM } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function BillingRatesPage() {
  const { state, dispatch } = useStore();
  const chargeable = state.codes.filter(
    (c) => c.docType === "IV" && c.frequency !== "One-off"
  );
  const [codeId, setCodeId] = useState(chargeable[0]?.code ?? "");
  const code = state.codes.find((c) => c.code === codeId);

  const [rateInput, setRateInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [preview, setPreview] = useState<{
    method: "rate" | "fixed";
    value: number;
  } | null>(null);

  const effective = preview ?? (code ? { method: code.method, value: code.rate } : null);

  const rows = useMemo(
    () => [...state.lots].sort((a, b) => a.id.localeCompare(b.id)),
    [state.lots]
  );

  function fillNow() {
    const rate = parseFloat(rateInput);
    const amt = parseFloat(amountInput);
    if (!isNaN(rate) && rate > 0) setPreview({ method: "rate", value: rate });
    else if (!isNaN(amt) && amt > 0) setPreview({ method: "fixed", value: amt });
  }

  function save() {
    if (!code || !preview) return;
    dispatch({
      type: "upsertCode",
      code: { ...code, method: preview.method, rate: preview.value },
    });
    setPreview(null);
    setRateInput("");
    setAmountInput("");
  }

  return (
    <div>
      <PageHeader
        title="Lot Billing Rate"
        subtitle="Set how each recurring charge is computed across lots"
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setPreview(null);
                setRateInput("");
                setAmountInput("");
              }}
            >
              Refresh
            </button>
            <button className="btn-primary" onClick={save} disabled={!preview}>
              Save
            </button>
          </>
        }
      />

      <div className="card no-print mb-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label">Billing Code</label>
          <select
            className="input w-40"
            value={codeId}
            onChange={(e) => {
              setCodeId(e.target.value);
              setPreview(null);
            }}
          >
            {chargeable.map((c) => (
              <option key={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Month Frequency</label>
          <input className="input w-32" value={code?.frequency ?? ""} disabled />
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <label className="label">Rate (RM / sq ft)</label>
          <input
            className="input w-32"
            placeholder="e.g. 0.25"
            value={rateInput}
            onChange={(e) => {
              setRateInput(e.target.value);
              setAmountInput("");
            }}
          />
        </div>
        <div>
          <label className="label">Lot Amount (RM)</label>
          <input
            className="input w-32"
            placeholder="e.g. 100"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setRateInput("");
            }}
          />
        </div>
        <button className="btn-secondary" onClick={fillNow}>
          Fill Now
        </button>
        {preview && (
          <Badge tone="warn">Preview — press Save to apply</Badge>
        )}
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Lot Num</th>
              <th className="th text-right">Built-up Area</th>
              <th className="th text-right">Rate</th>
              <th className="th text-right">Monthly Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((lot) => {
              const amount = !effective
                ? 0
                : effective.method === "rate"
                  ? Math.round(lot.builtUp * effective.value * 100) / 100
                  : effective.value;
              return (
                <tr key={lot.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                  <td className="td font-semibold">{lot.id}</td>
                  <td className="td text-right">{fmtNum(lot.builtUp, 2)}</td>
                  <td className="td text-right text-soot/70">
                    {effective?.method === "rate"
                      ? fmtNum(effective.value, 4)
                      : "—"}
                  </td>
                  <td className="td text-right font-semibold">{fmtRM(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
