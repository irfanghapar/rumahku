"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Drawer,
  Field,
  PageHeader,
  SearchInput,
} from "@/components/ui";
import { fmtNum } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Lot, LotType } from "@/lib/types";

const emptyLot: Lot = {
  id: "",
  block: "A",
  level: 1,
  type: "Apartment",
  builtUp: 850,
  shareUnits: 85,
  bumi: "Non-Bumi",
  address: "",
  subPhase: "",
  levelDesc: "",
  model: "",
  landArea: 0,
  strataNum: "",
  facing: "",
  position: "",
  remarks: "",
};

const SQFT_TO_SQM = 0.092903;

export default function LotsPage() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [block, setBlock] = useState("All");
  const [editing, setEditing] = useState<Lot | null>(null);
  const [isNew, setIsNew] = useState(false);

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

  function save() {
    if (!editing || !editing.id) return;
    dispatch({ type: "upsertLot", lot: editing });
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Lot Information"
        subtitle="Register and maintain every unit in the property"
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing({ ...emptyLot });
              setIsNew(true);
            }}
          >
            + New Lot
          </button>
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
                    {owner ? (
                      owner.name
                    ) : (
                      <span className="text-soot/40">Vacant</span>
                    )}
                  </td>
                  <td className="td text-right">
                    <button
                      className="btn-ghost !px-2 !py-1 text-xs"
                      onClick={() => {
                        setEditing({ ...lot });
                        setIsNew(false);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!editing}
        title={isNew ? "New Lot" : `Edit Lot ${editing?.id}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!editing?.id}>
              Save Lot
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Lot Num" className="sm:col-span-2">
              <input
                className="input"
                value={editing.id}
                disabled={!isNew}
                placeholder="e.g. A-06-01"
                onChange={(e) =>
                  setEditing({ ...editing, id: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Block">
              <input
                className="input"
                value={editing.block}
                onChange={(e) => setEditing({ ...editing, block: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Level Num">
              <input
                type="number"
                className="input"
                value={editing.level}
                onChange={(e) =>
                  setEditing({ ...editing, level: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Property Type">
              <select
                className="input"
                value={editing.type}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value as LotType })
                }
              >
                <option>Apartment</option>
                <option>Duplex</option>
                <option>Penthouse</option>
                <option>Shop</option>
              </select>
            </Field>
            <Field label="Bumi Status">
              <select
                className="input"
                value={editing.bumi}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    bumi: e.target.value as Lot["bumi"],
                  })
                }
              >
                <option>Non-Bumi</option>
                <option>Bumi</option>
              </select>
            </Field>
            <Field label="Sub Phase">
              <input
                className="input"
                value={editing.subPhase ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, subPhase: e.target.value })
                }
              />
            </Field>
            <Field label="Level Dscp">
              <input
                className="input"
                value={editing.levelDesc ?? ""}
                placeholder="e.g. Podium, Ground"
                onChange={(e) =>
                  setEditing({ ...editing, levelDesc: e.target.value })
                }
              />
            </Field>
            <Field label="Model">
              <input
                className="input"
                value={editing.model ?? ""}
                placeholder="e.g. Type A"
                onChange={(e) => setEditing({ ...editing, model: e.target.value })}
              />
            </Field>
            <Field label="Strata Num">
              <input
                className="input"
                value={editing.strataNum ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, strataNum: e.target.value })
                }
              />
            </Field>
            <Field label="Built-up Area (sq ft)">
              <input
                type="number"
                className="input"
                value={editing.builtUp}
                onChange={(e) =>
                  setEditing({ ...editing, builtUp: Number(e.target.value) })
                }
              />
              <p className="mt-1 text-xs text-soot/50">
                ≈ {(editing.builtUp * SQFT_TO_SQM).toFixed(2)} sq m
              </p>
            </Field>
            <Field label="Land Area (sq ft)">
              <input
                type="number"
                className="input"
                value={editing.landArea ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, landArea: Number(e.target.value) })
                }
              />
              <p className="mt-1 text-xs text-soot/50">
                ≈ {((editing.landArea ?? 0) * SQFT_TO_SQM).toFixed(2)} sq m ·
                strata units are usually 0
              </p>
            </Field>
            <Field label="Share Units">
              <input
                type="number"
                className="input"
                value={editing.shareUnits}
                onChange={(e) =>
                  setEditing({ ...editing, shareUnits: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Facing">
              <input
                className="input"
                value={editing.facing ?? ""}
                placeholder="e.g. Pool View"
                onChange={(e) =>
                  setEditing({ ...editing, facing: e.target.value })
                }
              />
            </Field>
            <Field label="Position">
              <select
                className="input"
                value={editing.position ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, position: e.target.value })
                }
              >
                <option value="">—</option>
                <option>Corner</option>
                <option>Intermediate</option>
                <option>End</option>
              </select>
            </Field>
            <Field label="Lot Actual Address" className="sm:col-span-2">
              <textarea
                className="input min-h-[70px]"
                value={editing.address}
                onChange={(e) =>
                  setEditing({ ...editing, address: e.target.value })
                }
              />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <textarea
                className="input min-h-[56px]"
                value={editing.remarks ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, remarks: e.target.value })
                }
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}
