"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Field, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { BillingCode, DocType } from "@/lib/types";

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "IV", label: "IV — Invoice" },
  { value: "UB", label: "UB — Utility Billing" },
  { value: "IA", label: "IA — Interest Advice" },
  { value: "DN", label: "DN — Debit Note" },
  { value: "CN", label: "CN — Credit Note" },
];

const emptyCode: BillingCode = {
  code: "",
  docType: "IV",
  description: "",
  method: "fixed",
  rate: 0,
  frequency: "Monthly",
  debitAcc: "1201001",
  creditAcc: "",
  active: true,
  dueDays: 14,
  lpiChargeable: false,
  lpiRate: 0,
  lpiGrace: 14,
  lpiSkip: 0,
  lpiMin: 0,
  taxable: false,
  sstCode: "EX",
  postConsolidated: false,
  offset: true,
};

export default function BillingCodeForm({ code: codeId }: { code?: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const isNew = !codeId;
  const record = codeId ? state.codes.find((c) => c.code === codeId) : undefined;

  const [form, setForm] = useState<BillingCode | null>(
    isNew ? { ...emptyCode } : record ?? null
  );
  useEffect(() => {
    if (!isNew && form === null && record) setForm(record);
  }, [record, isNew, form]);

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: "Setup" },
        { label: "Billing Codes", href: "/setup/billing-codes" },
        { label: isNew ? "New code" : codeId ?? "Edit" },
      ]}
    />
  );

  if (!isNew && !form) {
    return (
      <div>
        {crumbs}
        <p className="card p-8 text-center text-sm text-soot/60">Loading code…</p>
      </div>
    );
  }
  const f = form!;
  const set = (patch: Partial<BillingCode>) => setForm({ ...f, ...patch });

  function save() {
    if (!f.code || !f.description) return;
    dispatch({ type: "upsertCode", code: { ...f, code: f.code.toUpperCase() } });
    router.push("/setup/billing-codes");
  }

  const actions = (
    <>
      <button
        className="btn-secondary"
        onClick={() => router.push("/setup/billing-codes")}
      >
        Cancel
      </button>
      <button
        className="btn-primary"
        onClick={save}
        disabled={!f.code || !f.description}
      >
        Save Code
      </button>
    </>
  );

  return (
    <div>
      {crumbs}
      <PageHeader
        title={isNew ? "New Billing Code" : `Edit ${f.code}`}
        subtitle="GL code that drives a charge — like the CSS GL Code screen"
        actions={actions}
      />

      <div className="card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Document Code">
            <select
              className="input"
              value={f.docType}
              onChange={(e) => set({ docType: e.target.value as DocType })}
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="GL Code">
            <input
              className="input"
              value={f.code}
              disabled={!isNew}
              placeholder="e.g. IVSC"
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={f.active ? "Active" : "Suspended"}
              onChange={(e) => set({ active: e.target.value === "Active" })}
            >
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </Field>
          <Field label="Item Description" className="sm:col-span-2 lg:col-span-3">
            <input
              className="input"
              value={f.description}
              onChange={(e) => set({ description: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Charging Method">
            <select
              className="input"
              value={f.method}
              onChange={(e) =>
                set({ method: e.target.value as BillingCode["method"] })
              }
            >
              <option value="fixed">Fixed amount (RM)</option>
              <option value="rate">Rate per sq ft</option>
            </select>
          </Field>
          <Field label={f.method === "rate" ? "Rate (RM / sq ft)" : "Amount (RM)"}>
            <input
              type="number"
              step="0.0001"
              className="input"
              value={f.rate}
              onChange={(e) => set({ rate: Number(e.target.value) })}
            />
          </Field>
          <Field label="Frequency">
            <select
              className="input"
              value={f.frequency}
              onChange={(e) =>
                set({ frequency: e.target.value as BillingCode["frequency"] })
              }
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>One-off</option>
            </select>
          </Field>
          <Field label="Debit Acctno">
            <input
              className="input"
              value={f.debitAcc}
              onChange={(e) => set({ debitAcc: e.target.value })}
            />
          </Field>
          <Field label="Credit Acctno">
            <input
              className="input"
              value={f.creditAcc}
              onChange={(e) => set({ creditAcc: e.target.value })}
            />
          </Field>
          <Field label="Due Days">
            <input
              type="number"
              className="input"
              value={f.dueDays}
              onChange={(e) => set({ dueDays: Number(e.target.value) })}
            />
          </Field>
        </div>

        {/* LPI */}
        <div className="mt-5 rounded-xl border border-line bg-cream/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Late Payment Interest</h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-clay-500"
                checked={f.lpiChargeable}
                onChange={(e) => set({ lpiChargeable: e.target.checked })}
              />
              LPI Chargeable
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="LPI Rate (% p.a.)">
              <input
                type="number"
                step="0.5"
                className="input"
                disabled={!f.lpiChargeable}
                value={f.lpiRate}
                onChange={(e) => set({ lpiRate: Number(e.target.value) })}
              />
            </Field>
            <Field label="LPI Grace (days)">
              <input
                type="number"
                className="input"
                disabled={!f.lpiChargeable}
                value={f.lpiGrace}
                onChange={(e) => set({ lpiGrace: Number(e.target.value) })}
              />
            </Field>
            <Field label="LPI Skip (months)">
              <input
                type="number"
                className="input"
                disabled={!f.lpiChargeable}
                value={f.lpiSkip}
                onChange={(e) => set({ lpiSkip: Number(e.target.value) })}
              />
            </Field>
            <Field label="Minimum LPI (RM)">
              <input
                type="number"
                step="0.01"
                className="input"
                disabled={!f.lpiChargeable}
                value={f.lpiMin}
                onChange={(e) => set({ lpiMin: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>

        {/* SST */}
        <div className="mt-4 rounded-xl border border-line bg-cream/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Service Tax (SST)</h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-clay-500"
                checked={f.taxable}
                onChange={(e) =>
                  set({
                    taxable: e.target.checked,
                    sstCode: e.target.checked ? "SR" : "EX",
                  })
                }
              />
              SST applies
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SST Code">
              <select
                className="input"
                value={f.sstCode}
                onChange={(e) =>
                  set({
                    sstCode: e.target.value as BillingCode["sstCode"],
                    taxable: e.target.value === "SR",
                  })
                }
              >
                <option value="SR">SR — Standard-Rated</option>
                <option value="EX">EX — Exempt</option>
                <option value="OS">OS — Out of Scope</option>
              </select>
            </Field>
            <Field label="Rate applied">
              <input
                className="input"
                disabled
                value={
                  f.taxable
                    ? `${state.settings.sstRatePct}% (from Settings)`
                    : "No SST"
                }
              />
            </Field>
          </div>
        </div>

        {/* GL posting */}
        <div className="mt-4 rounded-xl border border-line bg-cream/40 p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">GL Posting</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-clay-500"
                checked={f.postConsolidated}
                onChange={(e) => set({ postConsolidated: e.target.checked })}
              />
              Post consolidated sum to GL
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-clay-500"
                checked={f.offset}
                onChange={(e) => set({ offset: e.target.checked })}
              />
              Offsettable against payments
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          {actions}
        </div>
      </div>
    </div>
  );
}
