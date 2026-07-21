"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Field, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

const COURIERS = [
  "J&T Express",
  "Shopee Xpress",
  "Pos Laju",
  "GDex",
  "Ninja Van",
  "DHL",
  "Lalamove",
  "Other",
];

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ParcelForm() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({
    lotId: "",
    recipient: "",
    courier: COURIERS[0],
    trackingNo: "",
  });

  function ownerFor(lotId: string) {
    return state.owners.find(
      (o) => o.status === "Active" && o.lotIds.includes(lotId)
    );
  }

  function save() {
    if (!form.lotId) return;
    dispatch({
      type: "addParcel",
      parcel: {
        lotId: form.lotId,
        recipient: form.recipient || ownerFor(form.lotId)?.name || "Resident",
        courier: form.courier,
        trackingNo: form.trackingNo,
        receivedAt: nowLocal(),
        status: "At guardhouse",
      },
    });
    router.push("/community/parcels");
  }

  const actions = (
    <>
      <button
        className="btn-secondary"
        onClick={() => router.push("/community/parcels")}
      >
        Cancel
      </button>
      <button className="btn-primary" onClick={save} disabled={!form.lotId}>
        Log Parcel
      </button>
    </>
  );

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Community" },
          { label: "Parcels", href: "/community/parcels" },
          { label: "Log parcel" },
        ]}
      />
      <PageHeader
        title="Log Parcel"
        subtitle="Record a delivery received at the guardhouse"
        actions={actions}
      />

      <div className="card mx-auto max-w-2xl p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Lot Num">
            <select
              className="input"
              value={form.lotId}
              onChange={(e) => {
                const lotId = e.target.value;
                setForm({
                  ...form,
                  lotId,
                  recipient: ownerFor(lotId)?.name ?? "",
                });
              }}
            >
              <option value="">Select lot…</option>
              {[...state.lots]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((l) => (
                  <option key={l.id}>{l.id}</option>
                ))}
            </select>
          </Field>
          <Field label="Recipient">
            <input
              className="input"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            />
          </Field>
          <Field label="Courier">
            <select
              className="input"
              value={form.courier}
              onChange={(e) => setForm({ ...form, courier: e.target.value })}
            >
              {COURIERS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Tracking No">
            <input
              className="input"
              value={form.trackingNo}
              placeholder="e.g. MY1234567890"
              onChange={(e) =>
                setForm({ ...form, trackingNo: e.target.value.toUpperCase() })
              }
            />
          </Field>
        </div>
        <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-xs text-soot/70">
          Received time is stamped automatically when you log the parcel.
        </p>
        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          {actions}
        </div>
      </div>
    </div>
  );
}
