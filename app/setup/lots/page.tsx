"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, PageHeader, SearchInput } from "@/components/ui";
import { fmtNum } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function LotsPage() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [block, setBlock] = useState("All");

  const blocks = Array.from(new Set(state.lots.map((l) => l.block))).sort();

  const rows = useMemo(
    () =>
      state.lots
        .filter((l) => (block === "All" ? true : l.block === block))
        .filter((l) => l.id.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.id.localeCompare(b.id)),
    [state.lots, q, block]
  );

  function ownerOf(lotId: string) {
    return state.owners.find(
      (o) => o.status === "Active" && o.lotIds.includes(lotId)
    );
  }

  return (
    <div>
      <PageHeader
        title="Lot Information"
        subtitle="Register and maintain every unit in the property"
        actions={
          <Link href="/setup/lots/new" className="btn-primary">
            + New Lot
          </Link>
        }
      />

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <SearchInput value={q} onChange={setQ} placeholder="Search lot number…" />
        </div>
        <select
          className="input w-36"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
        >
          <option>All</option>
          {blocks.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <p className="ml-auto text-xs text-soot/60">{rows.length} lots</p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Lot Num</th>
              <th className="th">Block / Level</th>
              <th className="th">Type</th>
              <th className="th text-right">Built-up (sq ft)</th>
              <th className="th text-right">Share Units</th>
              <th className="th">Bumi Status</th>
              <th className="th">Owner</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((lot) => {
              const owner = ownerOf(lot.id);
              return (
                <tr key={lot.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                  <td className="td font-semibold">{lot.id}</td>
                  <td className="td">
                    Block {lot.block} · L{lot.level}
                  </td>
                  <td className="td">{lot.type}</td>
                  <td className="td text-right">{fmtNum(lot.builtUp, 0)}</td>
                  <td className="td text-right">{lot.shareUnits}</td>
                  <td className="td">
                    <Badge tone={lot.bumi === "Bumi" ? "good" : "neutral"}>
                      {lot.bumi}
                    </Badge>
                  </td>
                  <td className="td">
                    {owner ? owner.name : <span className="text-soot/40">Vacant</span>}
                  </td>
                  <td className="td text-right">
                    <Link
                      href={`/setup/lots/${encodeURIComponent(lot.id)}/edit`}
                      className="btn-ghost !px-2 !py-1 text-xs"
                    >
                      Edit
                    </Link>
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
