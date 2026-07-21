"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PageHeader, SearchInput, StatCard } from "@/components/ui";
import { fmtRM } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ParkingPage() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("All");

  const levels = Array.from(new Set(state.bays.map((b) => b.level))).sort();

  const rows = useMemo(
    () =>
      state.bays
        .filter((b) => (level === "All" ? true : b.level === level))
        .filter(
          (b) =>
            b.id.toLowerCase().includes(q.toLowerCase()) ||
            (b.assignedLotId ?? "").toLowerCase().includes(q.toLowerCase()) ||
            b.plate.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => a.id.localeCompare(b.id)),
    [state.bays, q, level]
  );

  const assigned = state.bays.filter((b) => b.assignedLotId);
  const visitor = state.bays.filter((b) => b.type === "Visitor");
  const rentalIncome = state.bays.reduce((s, b) => s + b.monthly, 0);

  function ownerFor(lotId: string | null) {
    if (!lotId) return undefined;
    return state.owners.find(
      (o) => o.status === "Active" && o.lotIds.includes(lotId)
    );
  }

  return (
    <div>
      <PageHeader
        title="Parking Management"
        subtitle="Bays, assignments, stickers and visitor parking"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total bays"
          value={String(state.bays.length)}
          hint={`${levels.join(" · ")}`}
        />
        <StatCard
          label="Assigned"
          value={`${assigned.length} / ${state.bays.filter((b) => b.type === "Resident").length}`}
          hint="Resident bays"
          tone="good"
        />
        <StatCard label="Visitor bays" value={String(visitor.length)} />
        <StatCard
          label="Rental income / mo"
          value={fmtRM(rentalIncome)}
          hint="From rented bays"
        />
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search bay, lot or plate…"
          />
        </div>
        {["All", ...levels].map((lv) => (
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
        ))}
        <p className="ml-auto text-xs text-soot/60">{rows.length} bays</p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Bay</th>
              <th className="th">Type</th>
              <th className="th">Assigned Lot</th>
              <th className="th">Owner</th>
              <th className="th">Vehicle Plate</th>
              <th className="th">Sticker</th>
              <th className="th text-right">Monthly</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const owner = ownerFor(b.assignedLotId);
              return (
                <tr key={b.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                  <td className="td font-semibold">{b.id}</td>
                  <td className="td">
                    <Badge
                      tone={
                        b.type === "Visitor"
                          ? "warn"
                          : b.type === "OKU"
                            ? "clay"
                            : "neutral"
                      }
                    >
                      {b.type}
                    </Badge>
                  </td>
                  <td className="td">
                    {b.assignedLotId ?? (
                      <span className="text-soot/40">
                        {b.type === "Resident" ? "Unassigned" : "—"}
                      </span>
                    )}
                  </td>
                  <td className="td text-soot/80">{owner?.name ?? "—"}</td>
                  <td className="td font-semibold tracking-wide">
                    {b.plate || "—"}
                  </td>
                  <td className="td text-soot/70">{b.sticker || "—"}</td>
                  <td className="td text-right">
                    {b.monthly > 0 ? (
                      fmtRM(b.monthly)
                    ) : b.assignedLotId ? (
                      <span className="text-soot/50">Included</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="td text-right">
                    {b.type === "Resident" &&
                      (b.assignedLotId ? (
                        <span className="inline-flex gap-1">
                          <Link
                            href={`/community/parking/${encodeURIComponent(b.id)}/edit`}
                            className="btn-ghost !px-2 !py-1 text-xs"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn-secondary !px-2 !py-1 text-xs"
                            onClick={() =>
                              dispatch({ type: "releaseBay", bayId: b.id })
                            }
                          >
                            Release
                          </button>
                        </span>
                      ) : (
                        <Link
                          href={`/community/parking/${encodeURIComponent(b.id)}/edit`}
                          className="btn-primary !px-3 !py-1 text-xs"
                        >
                          Assign
                        </Link>
                      ))}
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
