"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { fmtNum, freqDays } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function BillingCodesPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<string>("All");

  const rows = state.codes.filter((c) =>
    filter === "All" ? true : c.docType === filter
  );

  return (
    <div>
      <PageHeader
        title="Billing Codes"
        subtitle="GL codes that drive every charge — like the CSS GL Code screen"
        actions={
          <Link href="/setup/billing-codes/new" className="btn-primary">
            + New Code
          </Link>
        }
      />

      <div className="no-print mb-4 flex items-center gap-2">
        {["All", "IV", "UB", "IA", "DN", "CN"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
              (filter === t
                ? "border-clay-500 bg-clay-500 text-lime-400"
                : "border-line bg-paper text-soot hover:bg-cream")
            }
          >
            {t}
          </button>
        ))}
        <p className="ml-auto text-xs text-soot/60">{rows.length} codes</p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Code</th>
              <th className="th">Doc</th>
              <th className="th">Item Description</th>
              <th className="th text-right">Rate / Amount</th>
              <th className="th">Frequency</th>
              <th className="th text-center">LPI</th>
              <th className="th text-center">SST</th>
              <th className="th">Accounts (Dr / Cr)</th>
              <th className="th">Status</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.code} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td font-semibold">{c.code}</td>
                <td className="td">
                  <Badge tone="neutral">{c.docType}</Badge>
                </td>
                <td className="td">{c.description}</td>
                <td className="td text-right">
                  {c.method === "rate"
                    ? `RM ${fmtNum(c.rate, 4)} / sq ft`
                    : `RM ${fmtNum(c.rate)}`}
                </td>
                <td className="td whitespace-nowrap">
                  {c.frequency}
                  {freqDays(c.frequency) > 0 && (
                    <span className="ml-1 text-xs text-soot/50">
                      · {freqDays(c.frequency)}d
                    </span>
                  )}
                </td>
                <td className="td text-center">
                  {c.lpiChargeable ? (
                    <Badge tone="warn">{fmtNum(c.lpiRate, 0)}%</Badge>
                  ) : (
                    <span className="text-soot/30">—</span>
                  )}
                </td>
                <td className="td text-center">
                  {c.taxable ? (
                    <Badge tone="clay">{c.sstCode}</Badge>
                  ) : (
                    <span className="text-soot/30">{c.sstCode}</span>
                  )}
                </td>
                <td className="td text-soot/70">
                  {c.debitAcc} / {c.creditAcc}
                </td>
                <td className="td">
                  <Badge tone={c.active ? "good" : "bad"}>
                    {c.active ? "Active" : "Suspended"}
                  </Badge>
                </td>
                <td className="td text-right">
                  <Link
                    href={`/setup/billing-codes/${encodeURIComponent(c.code)}/edit`}
                    className="btn-ghost !px-2 !py-1 text-xs"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
