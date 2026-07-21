"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Field, PageHeader } from "@/components/ui";
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

export default function LotForm({ lotId }: { lotId?: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const isNew = !lotId;
  const record = lotId ? state.lots.find((l) => l.id === lotId) : undefined;

  const [form, setForm] = useState<Lot | null>(isNew ? { ...emptyLot } : record ?? null);
  useEffect(() => {
    if (!isNew && form === null && record) setForm(record);
  }, [record, isNew, form]);

  if (!isNew && !form) {
    return (
      <div>
        <Breadcrumbs
          items={[
            { label: "Setup" },
            { label: "Lot Information", href: "/setup/lots" },
            { label: "Edit" },
          ]}
        />
        <p className="card p-8 text-center text-sm text-soot/60">Loading lot…</p>
      </div>
    );
  }
  const f = form!;
  const set = (patch: Partial<Lot>) => setForm({ ...f, ...patch });

  function save() {
    if (!f.id) return;
    dispatch({ type: "upsertLot", lot: f });
    router.push("/setup/lots");
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Setup" },
          { label: "Lot Information", href: "/setup/lots" },
          { label: isNew ? "New lot" : f.id },
        ]}
      />
      <PageHeader
        title={isNew ? "New Lot" : `Edit Lot ${f.id}`}
        subtitle="Register and maintain a unit in the property"
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => router.push("/setup/lots")}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!f.id}>
              Save Lot
            </button>
          </>
        }
      />

      <div className="card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Lot Num">
            <input
              className="input"
              value={f.id}
              disabled={!isNew}
              placeholder="e.g. A-06-01"
              onChange={(e) => set({ id: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Block">
            <input
              className="input"
              value={f.block}
              onChange={(e) => set({ block: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Level Num">
            <input
              type="number"
              className="input"
              value={f.level}
              onChange={(e) => set({ level: Number(e.target.value) })}
            />
          </Field>
          <Field label="Sub Phase">
            <input
              className="input"
              value={f.subPhase ?? ""}
              onChange={(e) => set({ subPhase: e.target.value })}
            />
          </Field>
          <Field label="Level Dscp">
            <input
              className="input"
              value={f.levelDesc ?? ""}
              placeholder="e.g. Podium, Ground"
              onChange={(e) => set({ levelDesc: e.target.value })}
            />
          </Field>
          <Field label="Property Type">
            <select
              className="input"
              value={f.type}
              onChange={(e) => set({ type: e.target.value as LotType })}
            >
              <option>Apartment</option>
              <option>Duplex</option>
              <option>Penthouse</option>
              <option>Shop</option>
            </select>
          </Field>
          <Field label="Model">
            <input
              className="input"
              value={f.model ?? ""}
              placeholder="e.g. Type A"
              onChange={(e) => set({ model: e.target.value })}
            />
          </Field>
          <Field label="Strata Num">
            <input
              className="input"
              value={f.strataNum ?? ""}
              onChange={(e) => set({ strataNum: e.target.value })}
            />
          </Field>
          <Field label="Bumi Status">
            <select
              className="input"
              value={f.bumi}
              onChange={(e) => set({ bumi: e.target.value as Lot["bumi"] })}
            >
              <option>Non-Bumi</option>
              <option>Bumi</option>
            </select>
          </Field>
          <Field label="Built-up Area (sq ft)">
            <input
              type="number"
              className="input"
              value={f.builtUp}
              onChange={(e) => set({ builtUp: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-soot/50">
              ≈ {(f.builtUp * SQFT_TO_SQM).toFixed(2)} sq m
            </p>
          </Field>
          <Field label="Land Area (sq ft)">
            <input
              type="number"
              className="input"
              value={f.landArea ?? 0}
              onChange={(e) => set({ landArea: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-soot/50">
              ≈ {((f.landArea ?? 0) * SQFT_TO_SQM).toFixed(2)} sq m · strata units
              are usually 0
            </p>
          </Field>
          <Field label="Share Units">
            <input
              type="number"
              className="input"
              value={f.shareUnits}
              onChange={(e) => set({ shareUnits: Number(e.target.value) })}
            />
          </Field>
          <Field label="Facing">
            <input
              className="input"
              value={f.facing ?? ""}
              placeholder="e.g. Pool View"
              onChange={(e) => set({ facing: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <select
              className="input"
              value={f.position ?? ""}
              onChange={(e) => set({ position: e.target.value })}
            >
              <option value="">—</option>
              <option>Corner</option>
              <option>Intermediate</option>
              <option>End</option>
            </select>
          </Field>
          <Field label="Lot Actual Address" className="sm:col-span-2 lg:col-span-3">
            <textarea
              className="input min-h-[70px]"
              value={f.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Field>
          <Field label="Remarks" className="sm:col-span-2 lg:col-span-3">
            <textarea
              className="input min-h-[56px]"
              value={f.remarks ?? ""}
              onChange={(e) => set({ remarks: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <button
            className="btn-secondary"
            onClick={() => router.push("/setup/lots")}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!f.id}>
            Save Lot
          </button>
        </div>
      </div>
    </div>
  );
}
