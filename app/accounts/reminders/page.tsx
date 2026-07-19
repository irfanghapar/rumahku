"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { daysBetween, fmtDate, fmtRM, todayISO } from "@/lib/format";
import { outstandingForLot, useStore } from "@/lib/store";

type Level = "1st Reminder" | "2nd Reminder" | "Final Notice";

const LEVEL_COPY: Record<Level, { tone: "warn" | "bad"; intro: string; warn: string }> = {
  "1st Reminder": {
    tone: "warn",
    intro:
      "Our records show the following charges on your account remain outstanding. We would appreciate your prompt settlement.",
    warn: "Kindly settle the amount above by the due date to keep your account in good standing.",
  },
  "2nd Reminder": {
    tone: "warn",
    intro:
      "This is a second reminder that the following charges remain unpaid despite our earlier notice. Please arrange for settlement without further delay.",
    warn: "Late payment interest continues to accrue on overdue balances until fully settled.",
  },
  "Final Notice": {
    tone: "bad",
    intro:
      "This is a FINAL NOTICE. The following charges remain outstanding. Failure to settle may result in suspension of facility access and further recovery action in accordance with the house rules and the Strata Management Act 2013.",
    warn: "Please settle the full amount immediately to avoid enforcement action.",
  },
};

export default function RemindersPage() {
  const { state } = useStore();
  const today = todayISO();
  const [level, setLevel] = useState<Level>("1st Reminder");
  const [sent, setSent] = useState<Record<string, string>>({});

  const debtors = useMemo(() => {
    return state.lots
      .map((lot) => {
        const items = outstandingForLot(state, lot.id);
        const total = items.reduce((s, i) => s + i.balance, 0);
        const owner = state.owners.find(
          (o) => o.status === "Active" && o.lotIds.includes(lot.id)
        );
        const oldest = items.reduce(
          (mx, i) => Math.max(mx, daysBetween(i.dueDate, today)),
          0
        );
        return { lot, owner, items, total, oldest };
      })
      .filter((d) => d.total > 0.004)
      .sort((a, b) => b.oldest - a.oldest);
  }, [state, today]);

  const [selectedLot, setSelectedLot] = useState(debtors[0]?.lot.id ?? "");
  const current =
    debtors.find((d) => d.lot.id === selectedLot) ?? debtors[0] ?? null;

  const grandTotal = debtors.reduce((s, d) => s + d.total, 0);
  const copy = LEVEL_COPY[level];

  function markSent(channel: "SMS" | "Email") {
    if (!current) return;
    setSent({
      ...sent,
      [current.lot.id]: `${channel} · ${level} · ${fmtDate(today)}`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Reminders & Statements"
        subtitle="Generate payment reminders and outstanding statements for debtors"
        actions={
          <button
            className="btn-secondary"
            onClick={() => window.print()}
            disabled={!current}
          >
            🖨 Print letter
          </button>
        }
      />

      <div className="no-print mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-soot/60">
            Debtors
          </p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {debtors.length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-soot/60">
            Total outstanding
          </p>
          <p className="mt-1 font-display text-xl font-bold text-danger-600">
            {fmtRM(grandTotal)}
          </p>
        </div>
        <div className="card col-span-2 p-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-soot/60">
            Notice level
          </p>
          <div className="flex flex-wrap gap-2">
            {(["1st Reminder", "2nd Reminder", "Final Notice"] as Level[]).map(
              (lv) => (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                    (level === lv
                      ? "border-clay-500 bg-clay-500 text-lime-400"
                      : "border-line bg-paper text-soot hover:bg-cream")
                  }
                >
                  {lv}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* debtor list */}
        <div className="no-print card lg:col-span-2">
          <div className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-bold text-ink">Debtors by age</h2>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {debtors.map((d) => (
              <button
                key={d.lot.id}
                onClick={() => setSelectedLot(d.lot.id)}
                className={
                  "flex w-full items-center justify-between gap-2 border-b border-line/60 px-5 py-3 text-left last:border-0 " +
                  (current?.lot.id === d.lot.id
                    ? "bg-clay-50"
                    : "hover:bg-cream/50")
                }
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {d.lot.id}{" "}
                    <span className="font-normal text-soot/60">
                      {d.owner?.name ?? "Vacant"}
                    </span>
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge tone={d.oldest > 60 ? "bad" : "warn"}>
                      {d.oldest > 0 ? `${d.oldest}d overdue` : "current"}
                    </Badge>
                    {sent[d.lot.id] && (
                      <span className="text-[10px] text-sage-600">
                        ✓ {sent[d.lot.id]}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-danger-600">
                  {fmtRM(d.total)}
                </span>
              </button>
            ))}
            {debtors.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-soot/60">
                No outstanding balances 🎉
              </p>
            )}
          </div>
        </div>

        {/* letter preview */}
        {current && (
          <div className="lg:col-span-3">
            <div className="print-area card p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    {state.settings.propertyName}
                  </h2>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-soot/70">
                    {state.settings.address}
                    <br />
                    Tel: {state.settings.phone} · {state.settings.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={copy.tone}>{level.toUpperCase()}</Badge>
                  <p className="mt-2 text-xs text-soot/70">{fmtDate(today)}</p>
                </div>
              </div>

              <div className="mt-6 text-sm">
                <p className="font-semibold text-ink">{current.owner?.name}</p>
                <p className="text-soot/70">
                  {current.lot.id} · {current.owner?.address ?? current.lot.address}
                </p>
              </div>

              <p className="mt-5 text-sm font-semibold text-ink">
                RE: OUTSTANDING MAINTENANCE CHARGES — {current.lot.id}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-soot">
                Dear {current.owner?.name?.split(" ")[0] ?? "Resident"},
              </p>
              <p className="mt-2 text-sm leading-relaxed text-soot">{copy.intro}</p>

              <table className="mt-4 w-full text-sm">
                <thead className="border-b border-line">
                  <tr>
                    <th className="th !px-2">Date</th>
                    <th className="th !px-2">Description</th>
                    <th className="th !px-2 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {current.items.map((inv) => (
                    <tr key={inv.id} className="border-b border-line/50">
                      <td className="td !px-2 whitespace-nowrap text-soot/70">
                        {fmtDate(inv.date)}
                      </td>
                      <td className="td !px-2">{inv.description}</td>
                      <td className="td !px-2 text-right">{fmtRM(inv.balance)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="td !px-2 font-bold" colSpan={2}>
                      TOTAL DUE
                    </td>
                    <td className="td !px-2 text-right font-display text-base font-bold text-danger-600">
                      {fmtRM(current.total)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-4 text-sm leading-relaxed text-soot">{copy.warn}</p>
              <p className="mt-4 text-sm leading-relaxed text-soot">
                Payment can be made via online banking, JomPAY or at the
                Management Office. Kindly disregard this notice if payment has
                already been made.
              </p>
              <p className="mt-6 text-sm text-soot">
                Thank you,
                <br />
                <span className="font-semibold text-ink">Management Office</span>
                <br />
                {state.settings.propertyName}
              </p>
            </div>

            <div className="no-print mt-4 flex flex-wrap items-center gap-2">
              <button className="btn-primary" onClick={() => markSent("SMS")}>
                Send via SMS
              </button>
              <button className="btn-dark" onClick={() => markSent("Email")}>
                Send via Email
              </button>
              {sent[current.lot.id] && (
                <span className="text-sm font-medium text-sage-600">
                  ✓ Sent — {sent[current.lot.id]}
                </span>
              )}
              <span className="ml-auto text-xs text-soot/50">
                Demo: sending is simulated — no real SMS/email is dispatched.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
