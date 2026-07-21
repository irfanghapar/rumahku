"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Breadcrumbs, Field, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function BayForm({ bayId }: { bayId: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const bay = state.bays.find((b) => b.id === bayId);

  const [form, setForm] = useState<{
    lotId: string;
    plate: string;
    sticker: string;
    monthly: string;
  } | null>(null);

  useEffect(() => {
    if (form === null && bay) {
      setForm({
        lotId: bay.assignedLotId ?? "",
        plate: bay.plate,
        sticker: bay.sticker || `STK-${String(2600 + state.bays.length)}`,
        monthly: String(bay.monthly),
      });
    }
  }, [bay, form, state.bays.length]);

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: "Community" },
        { label: "Parking", href: "/community/parking" },
        { label: bay ? `Bay ${bay.id}` : "Bay" },
      ]}
    />
  );

  if (!bay || !form) {
    return (
      <div>
        {crumbs}
        <p className="card p-8 text-center text-sm text-soot/60">Loading bay…</p>
      </div>
    );
  }

  function save() {
    if (!form || !form.lotId) return;
    dispatch({
      type: "assignBay",
      bayId,
      lotId: form.lotId,
      plate: form.plate.toUpperCase(),
      sticker: form.sticker.toUpperCase(),
      monthly: parseFloat(form.monthly) || 0,
    });
    router.push("/community/parking");
  }
  function release() {
    dispatch({ type: "releaseBay", bayId });
    router.push("/community/parking");
  }

  return (
    <div>
      {crumbs}
      <PageHeader
        title={`${bay.assignedLotId ? "Edit" : "Assign"} bay ${bay.id}`}
        subtitle={
          <>
            <Badge tone={bay.type === "Visitor" ? "warn" : bay.type === "OKU" ? "clay" : "neutral"}>
              {bay.type}
            </Badge>{" "}
            Level {bay.level}
          </>
        }
        actions={
          <>
            {bay.assignedLotId && (
              <button className="btn-secondary mr-auto" onClick={release}>
                Release bay
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => router.push("/community/parking")}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!form.lotId}>
              Save Assignment
            </button>
          </>
        }
      />

      <div className="card mx-auto max-w-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lot Num">
            <select
              className="input"
              value={form.lotId}
              onChange={(e) => setForm({ ...form, lotId: e.target.value })}
            >
              <option value="">Select lot…</option>
              {[...state.lots]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((l) => (
                  <option key={l.id}>{l.id}</option>
                ))}
            </select>
          </Field>
          <Field label="Vehicle Plate">
            <input
              className="input"
              value={form.plate}
              placeholder="e.g. WXY 1234"
              onChange={(e) => setForm({ ...form, plate: e.target.value })}
            />
          </Field>
          <Field label="Car Sticker No">
            <input
              className="input"
              value={form.sticker}
              onChange={(e) => setForm({ ...form, sticker: e.target.value })}
            />
          </Field>
          <Field label="Monthly Rental (RM, 0 = included)">
            <input
              className="input"
              inputMode="decimal"
              value={form.monthly}
              onChange={(e) => setForm({ ...form, monthly: e.target.value })}
            />
          </Field>
        </div>
        <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-xs text-soot/70">
          Tip: for rented bays, bill the rental monthly with the{" "}
          <span className="font-semibold">IVCP — Car Park Rental</span> code in
          Monthly Billing.
        </p>
        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <button
            className="btn-secondary"
            onClick={() => router.push("/community/parking")}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!form.lotId}>
            Save Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
