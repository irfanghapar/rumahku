"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui";
import { addDays, fmtDate, fmtNum, fmtRM, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function UtilityBillingPage() {
  const { state, dispatch } = useStore();
  const [readingDate, setReadingDate] = useState(todayISO());
  const [docDate, setDocDate] = useState(todayISO());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [posted, setPosted] = useState<number | null>(null);
  const [drafted, setDrafted] = useState(false);

  const tariff = state.settings.waterTariff;

  const rows = useMemo(() => {
    return [...state.meters]
      .sort((a, b) => a.lotId.localeCompare(b.lotId))
      .map((m) => {
        const owner = state.owners.find(
          (o) => o.status === "Active" && o.lotIds.includes(m.lotId)
        );
        const thisReading = parseFloat(inputs[m.lotId] ?? "");
        const valid = !isNaN(thisReading) && thisReading >= m.lastReading;
        const consume = valid ? thisReading - m.lastReading : 0;
        const prevConsume = m.lastConsume ?? 0;
        const variance =
          valid && prevConsume > 0
            ? Math.round(((consume - prevConsume) / prevConsume) * 100)
            : null;
        return {
          meter: m,
          owner,
          thisReading,
          valid,
          consume,
          prevConsume,
          variance,
          amount: Math.round(consume * tariff * 100) / 100,
        };
      });
  }, [state.meters, state.owners, inputs, tariff]);

  const ready = rows.filter((r) => r.valid && r.consume > 0);
  const total = ready.reduce((s, r) => s + r.amount, 0);

  function post() {
    if (ready.length === 0) return;
    dispatch({
      type: "postInvoices",
      docType: "UB",
      groupByLot: true,
      lines: ready.map((r) => ({
        lotId: r.meter.lotId,
        date: readingDate,
        dueDate: addDays(readingDate, state.settings.dueDays),
        code: "UBWM",
        docType: "UB" as const,
        description: `WATER METER ${r.meter.lastReading} → ${r.thisReading} (${r.consume} m³)`,
        amount: r.amount,
        periodStart: r.meter.lastDate ?? readingDate,
        periodEnd: readingDate,
      })),
    });
    for (const r of ready) {
      dispatch({
        type: "updateMeter",
        lotId: r.meter.lotId,
        date: readingDate,
        reading: r.thisReading,
      });
    }
    setPosted(ready.length);
    setInputs({});
    setTimeout(() => setPosted(null), 4000);
  }

  return (
    <div>
      <PageHeader
        title="Utility Meter Billing"
        subtitle={`Water billing at RM ${fmtNum(tariff)} per m³ — enter this month's readings`}
        actions={
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => {
                if (ready.length === 0) return;
                setDrafted(true);
                setTimeout(() => setDrafted(false), 3000);
              }}
              disabled={ready.length === 0}
            >
              Save to Draft
            </button>
            <button className="btn-primary" onClick={post} disabled={ready.length === 0}>
              Post {ready.length} to account
            </button>
          </div>
        }
      />

      {posted !== null && (
        <div className="mb-4 rounded-xl border border-sage-600/30 bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700">
          ✓ Posted {posted} water bills dated {fmtDate(docDate)}.
        </div>
      )}
      {drafted && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          ✓ {ready.length} readings saved to draft (not yet posted).
        </div>
      )}

      <div className="card no-print mb-4 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label">Billing Code</label>
          <input className="input w-32" value="UBWM" disabled />
        </div>
        <div>
          <label className="label">Reading Date</label>
          <input
            type="date"
            className="input w-40"
            value={readingDate}
            onChange={(e) => setReadingDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Doc Date</label>
          <input
            type="date"
            className="input w-40"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
          />
        </div>
        <p className="ml-auto text-sm text-soot/70">
          Total this run:{" "}
          <span className="font-display text-lg font-bold text-ink">
            {fmtRM(total)}
          </span>
        </p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Lot Num</th>
              <th className="th">Name</th>
              <th className="th">Meter No</th>
              <th className="th">Last Date</th>
              <th className="th text-right">Last Meter</th>
              <th className="th text-right">This Meter</th>
              <th className="th text-right">Prev Consume</th>
              <th className="th text-right">This Consume</th>
              <th className="th text-right">Variance</th>
              <th className="th text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.meter.lotId} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td font-semibold">{r.meter.lotId}</td>
                <td className="td">
                  {r.owner?.name ?? (
                    <span className="text-soot/40">Vacant</span>
                  )}
                </td>
                <td className="td text-soot/70">{r.meter.meterNo}</td>
                <td className="td">{fmtDate(r.meter.lastDate)}</td>
                <td className="td text-right">{fmtNum(r.meter.lastReading, 0)}</td>
                <td className="td text-right">
                  <input
                    className="input !w-24 text-right"
                    inputMode="numeric"
                    placeholder="—"
                    value={inputs[r.meter.lotId] ?? ""}
                    onChange={(e) =>
                      setInputs({ ...inputs, [r.meter.lotId]: e.target.value })
                    }
                  />
                </td>
                <td className="td text-right text-soot/70">
                  {r.prevConsume ? fmtNum(r.prevConsume, 0) : "—"}
                </td>
                <td className="td text-right">
                  {r.valid ? fmtNum(r.consume, 0) : "0"}
                </td>
                <td
                  className={
                    "td text-right " +
                    (r.variance == null
                      ? "text-soot/40"
                      : r.variance > 20
                        ? "text-danger-600"
                        : "text-soot/70")
                  }
                >
                  {r.variance == null ? "—" : `${r.variance > 0 ? "+" : ""}${r.variance}%`}
                </td>
                <td className="td text-right font-semibold">
                  {r.valid ? fmtRM(r.amount) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
