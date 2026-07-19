"use client";

import { useMemo, useState } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { fmtNum, fmtRM } from "@/lib/format";
import { useStore } from "@/lib/store";

type Scope = "all" | "single" | "range" | "query";
type DistributeBy = "Built-up Area" | "Equal Split";
type Info = "Built-up Area" | "Share Unit";

function roundTo(v: number, dp: number) {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}

export default function BillingRatesPage() {
  const { state, dispatch } = useStore();
  const chargeable = state.codes.filter(
    (c) => c.docType === "IV" && c.frequency !== "One-off"
  );
  const [codeId, setCodeId] = useState(chargeable[0]?.code ?? "");
  const code = state.codes.find((c) => c.code === codeId);

  const [scope, setScope] = useState<Scope>("all");
  const [single, setSingle] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [query, setQuery] = useState("");

  const [roundUp, setRoundUp] = useState(2);
  const [distributeBy, setDistributeBy] = useState<DistributeBy>("Built-up Area");
  const [info, setInfo] = useState<Info>("Built-up Area");

  const [rateInput, setRateInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [parentInput, setParentInput] = useState("");

  const [preview, setPreview] = useState<{
    amounts: Record<string, number>;
    rate: number | null;
  } | null>(null);

  const allLots = useMemo(
    () => [...state.lots].sort((a, b) => a.id.localeCompare(b.id)),
    [state.lots]
  );

  const selected = useMemo(() => {
    if (scope === "single")
      return allLots.filter((l) => l.id === single.trim().toUpperCase());
    if (scope === "range") {
      const a = rangeFrom.trim().toUpperCase();
      const b = rangeTo.trim().toUpperCase();
      return allLots.filter((l) => (!a || l.id >= a) && (!b || l.id <= b));
    }
    if (scope === "query")
      return allLots.filter((l) =>
        l.id.toLowerCase().includes(query.trim().toLowerCase())
      );
    return allLots;
  }, [allLots, scope, single, rangeFrom, rangeTo, query]);

  function fillNow() {
    const parent = parseFloat(parentInput);
    const rate = parseFloat(rateInput);
    const amt = parseFloat(amountInput);
    const amounts: Record<string, number> = {};
    let effRate: number | null = null;

    if (!isNaN(parent) && parent > 0 && selected.length) {
      // distribute a parent total across the selected lots
      if (distributeBy === "Equal Split") {
        const each = roundTo(parent / selected.length, roundUp);
        selected.forEach((l) => (amounts[l.id] = each));
      } else {
        const totalArea = selected.reduce((s, l) => s + l.builtUp, 0) || 1;
        effRate = parent / totalArea;
        selected.forEach(
          (l) => (amounts[l.id] = roundTo(l.builtUp * effRate!, roundUp))
        );
      }
    } else if (!isNaN(rate) && rate > 0) {
      effRate = rate;
      selected.forEach(
        (l) => (amounts[l.id] = roundTo(l.builtUp * rate, roundUp))
      );
    } else if (!isNaN(amt) && amt > 0) {
      selected.forEach((l) => (amounts[l.id] = roundTo(amt, roundUp)));
    } else {
      return;
    }
    setPreview({ amounts, rate: effRate });
  }

  function refresh() {
    setPreview(null);
    setRateInput("");
    setAmountInput("");
    setParentInput("");
  }

  function save() {
    if (!code || !preview) return;
    // persist what Monthly Billing can reproduce: a rate (per sq ft) when we
    // have one, otherwise a flat amount (uses the first selected lot's value).
    if (preview.rate != null) {
      dispatch({
        type: "upsertCode",
        code: { ...code, method: "rate", rate: roundTo(preview.rate, 4) },
      });
    } else {
      const flat = Object.values(preview.amounts)[0] ?? 0;
      dispatch({
        type: "upsertCode",
        code: { ...code, method: "fixed", rate: flat },
      });
    }
    refresh();
  }

  const totalPreview = preview
    ? Object.values(preview.amounts).reduce((s, v) => s + v, 0)
    : 0;

  return (
    <div>
      <PageHeader
        title="Lot Billing Rate"
        subtitle="Set how each recurring charge is computed across selected lots"
        actions={
          <>
            <button className="btn-secondary" onClick={refresh}>
              Refresh
            </button>
            <button className="btn-primary" onClick={save} disabled={!preview}>
              Save
            </button>
          </>
        }
      />

      {/* lot selection */}
      <div className="card no-print mb-4 p-4">
        <p className="mb-2 text-sm font-bold text-ink">Lot Selection</p>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All Lots"],
              ["single", "Single Lot"],
              ["range", "Lot Range"],
              ["query", "Query"],
            ] as [Scope, string][]
          ).map(([s, label]) => (
            <button
              key={s}
              onClick={() => {
                setScope(s);
                setPreview(null);
              }}
              className={
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                (scope === s
                  ? "border-clay-500 bg-clay-500 text-lime-400"
                  : "border-line bg-paper text-soot hover:bg-cream")
              }
            >
              {label}
            </button>
          ))}
          {scope === "single" && (
            <input
              className="input ml-2 w-40"
              placeholder="Lot e.g. A-01-01"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
            />
          )}
          {scope === "range" && (
            <div className="ml-2 flex items-center gap-2">
              <input
                className="input w-32"
                placeholder="From"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
              <span className="text-xs text-soot/60">to</span>
              <input
                className="input w-32"
                placeholder="To"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </div>
          )}
          {scope === "query" && (
            <input
              className="input ml-2 w-48"
              placeholder="Contains… e.g. A-01"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <span className="ml-auto text-xs text-soot/60">
            {selected.length} lots selected
          </span>
        </div>
      </div>

      {/* rate controls */}
      <div className="card no-print mb-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Billing Code</label>
          <select
            className="input w-36"
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
          <input className="input w-28" value={code?.frequency ?? ""} disabled />
        </div>
        <div>
          <label className="label">Round Up (dp)</label>
          <select
            className="input w-20"
            value={roundUp}
            onChange={(e) => setRoundUp(Number(e.target.value))}
          >
            {[0, 1, 2, 4].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <label className="label">Parent Amount</label>
          <input
            className="input w-32"
            placeholder="total RM"
            value={parentInput}
            onChange={(e) => {
              setParentInput(e.target.value);
              setRateInput("");
              setAmountInput("");
            }}
          />
        </div>
        <div>
          <label className="label">Distribute By</label>
          <select
            className="input w-40"
            value={distributeBy}
            onChange={(e) => setDistributeBy(e.target.value as DistributeBy)}
          >
            <option>Built-up Area</option>
            <option>Equal Split</option>
          </select>
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <label className="label">Rate (RM / sq ft)</label>
          <input
            className="input w-28"
            placeholder="0.25"
            value={rateInput}
            onChange={(e) => {
              setRateInput(e.target.value);
              setParentInput("");
              setAmountInput("");
            }}
          />
        </div>
        <div>
          <label className="label">Lot Amount (RM)</label>
          <input
            className="input w-28"
            placeholder="100"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setParentInput("");
              setRateInput("");
            }}
          />
        </div>
        <button className="btn-secondary" onClick={fillNow}>
          Fill Now
        </button>
        {preview && <Badge tone="warn">Preview — press Save to apply</Badge>}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="label !mb-0">Additional Info</label>
        <select
          className="input w-40"
          value={info}
          onChange={(e) => setInfo(e.target.value as Info)}
        >
          <option>Built-up Area</option>
          <option>Share Unit</option>
        </select>
        {preview && (
          <span className="ml-auto text-sm text-soot/70">
            Total: <span className="font-bold text-ink">{fmtRM(totalPreview)}</span>
          </span>
        )}
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Lot Num</th>
              <th className="th text-right">{info}</th>
              <th className="th text-right">Rate</th>
              <th className="th text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allLots.map((lot) => {
              const inScope = selected.some((s) => s.id === lot.id);
              const amount = preview?.amounts[lot.id];
              return (
                <tr
                  key={lot.id}
                  className={
                    "border-b border-line/60 last:border-0 " +
                    (inScope ? "hover:bg-cream/40" : "opacity-40")
                  }
                >
                  <td className="td font-semibold">{lot.id}</td>
                  <td className="td text-right">
                    {info === "Built-up Area"
                      ? fmtNum(lot.builtUp, 2)
                      : lot.shareUnits}
                  </td>
                  <td className="td text-right text-soot/70">
                    {preview?.rate != null ? fmtNum(preview.rate, 4) : "—"}
                  </td>
                  <td className="td text-right font-semibold">
                    {inScope && amount != null ? fmtRM(amount) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
