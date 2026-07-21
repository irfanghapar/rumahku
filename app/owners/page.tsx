"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PageHeader, SearchInput } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function OwnersPage() {
  const { state } = useStore();
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      state.owners
        .filter(
          (o) =>
            o.name.toLowerCase().includes(q.toLowerCase()) ||
            o.lotIds.some((l) => l.toLowerCase().includes(q.toLowerCase())) ||
            o.nric.includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.owners, q]
  );

  const vacantCount = state.lots.filter(
    (l) =>
      !state.owners.some((o) => o.status === "Active" && o.lotIds.includes(l.id))
  ).length;

  return (
    <div>
      <PageHeader
        title="Ownership Entry"
        subtitle="Owners registered against lots, with contact information"
        actions={
          <Link href="/owners/new" className="btn-primary">
            + New Entry
          </Link>
        }
      />

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search name, NRIC or lot…"
          />
        </div>
        <p className="ml-auto text-xs text-soot/60">
          {rows.length} owners · {vacantCount} vacant lots
        </p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Owner</th>
              <th className="th">NRIC / ROC</th>
              <th className="th">Lot(s)</th>
              <th className="th">Contact</th>
              <th className="th">Ownership Date</th>
              <th className="th">Status</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td">
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-soot/60">{o.id}</p>
                </td>
                <td className="td text-soot/80">{o.nric}</td>
                <td className="td">
                  {o.lotIds.map((l) => (
                    <Badge key={l} tone="neutral">
                      {l}
                    </Badge>
                  ))}
                </td>
                <td className="td">
                  <p className="text-sm">{o.phone}</p>
                  <p className="text-xs text-soot/60">{o.email}</p>
                </td>
                <td className="td">{fmtDate(o.since)}</td>
                <td className="td">
                  <Badge tone={o.status === "Active" ? "good" : "bad"}>
                    {o.status}
                  </Badge>
                </td>
                <td className="td text-right">
                  <Link
                    href={`/owners/${encodeURIComponent(o.id)}/edit`}
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
