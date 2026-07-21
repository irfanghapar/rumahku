"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PageHeader, SearchInput, StatCard } from "@/components/ui";
import { fmtDateTime, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ParcelsPage() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "At guardhouse" | "Collected">(
    "At guardhouse"
  );

  const rows = useMemo(
    () =>
      state.parcels
        .filter((p) => (filter === "All" ? true : p.status === filter))
        .filter(
          (p) =>
            p.lotId.toLowerCase().includes(q.toLowerCase()) ||
            p.recipient.toLowerCase().includes(q.toLowerCase()) ||
            p.trackingNo.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    [state.parcels, q, filter]
  );

  const waiting = state.parcels.filter((p) => p.status === "At guardhouse");
  const today = todayISO();
  const collectedToday = state.parcels.filter(
    (p) => p.status === "Collected" && (p.collectedAt ?? "").startsWith(today)
  );

  return (
    <div>
      <PageHeader
        title="Parcel Management"
        subtitle="Log deliveries at the guardhouse and track collection"
        actions={
          <Link href="/community/parcels/new" className="btn-primary">
            + Log Parcel
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="At guardhouse"
          value={String(waiting.length)}
          hint="Awaiting collection"
          tone={waiting.length > 0 ? "bad" : "default"}
        />
        <StatCard
          label="Collected today"
          value={String(collectedToday.length)}
          tone="good"
        />
        <StatCard label="Total logged" value={String(state.parcels.length)} />
        <StatCard
          label="Oldest waiting"
          value={
            waiting.length
              ? fmtDateTime(
                  [...waiting].sort((a, b) =>
                    a.receivedAt.localeCompare(b.receivedAt)
                  )[0].receivedAt
                ).split(" ")[0]
              : "—"
          }
        />
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search lot, name or tracking no…"
          />
        </div>
        {(["At guardhouse", "Collected", "All"] as const).map((fl) => (
          <button
            key={fl}
            onClick={() => setFilter(fl)}
            className={
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
              (filter === fl
                ? "border-clay-500 bg-clay-500 text-lime-400"
                : "border-line bg-paper text-soot hover:bg-cream")
            }
          >
            {fl}
          </button>
        ))}
        <p className="ml-auto text-xs text-soot/60">{rows.length} parcels</p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Parcel</th>
              <th className="th">Lot / Recipient</th>
              <th className="th">Courier</th>
              <th className="th">Tracking No</th>
              <th className="th">Received</th>
              <th className="th">Status</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td font-semibold">{p.id}</td>
                <td className="td">
                  <p className="font-semibold">{p.lotId}</p>
                  <p className="text-xs text-soot/60">{p.recipient}</p>
                </td>
                <td className="td">{p.courier}</td>
                <td className="td text-soot/70">{p.trackingNo}</td>
                <td className="td whitespace-nowrap">{fmtDateTime(p.receivedAt)}</td>
                <td className="td">
                  {p.status === "Collected" ? (
                    <div>
                      <Badge tone="good">Collected</Badge>
                      <p className="mt-0.5 text-[11px] text-soot/60">
                        {fmtDateTime(p.collectedAt)}
                        {p.collectedBy ? ` · ${p.collectedBy}` : ""}
                      </p>
                    </div>
                  ) : (
                    <Badge tone="warn">At guardhouse</Badge>
                  )}
                </td>
                <td className="td text-right">
                  {p.status === "At guardhouse" && (
                    <button
                      className="btn-primary !px-3 !py-1.5 text-xs"
                      onClick={() =>
                        dispatch({
                          type: "collectParcel",
                          id: p.id,
                          by: p.recipient.split(" ")[0],
                          at: nowLocal(),
                        })
                      }
                    >
                      Mark collected
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
