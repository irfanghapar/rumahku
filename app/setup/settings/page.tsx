"use client";

import { useState } from "react";
import { Field, NumberInput, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, dispatch } = useStore();
  const [form, setForm] = useState(state.settings);
  const [saved, setSaved] = useState(false);

  function save() {
    dispatch({ type: "updateSettings", settings: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Property Settings"
        subtitle="Details printed on bills, receipts and statements"
        actions={
          <button className="btn-primary" onClick={save}>
            {saved ? "Saved ✓" : "Save Settings"}
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-ink">Property</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Property Name" className="sm:col-span-2">
              <input
                className="input"
                value={form.propertyName}
                onChange={(e) =>
                  setForm({ ...form, propertyName: e.target.value })
                }
              />
            </Field>
            <Field label="Property Code">
              <input
                className="input"
                value={form.propertyCode}
                onChange={(e) =>
                  setForm({ ...form, propertyCode: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <input
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea
                className="input min-h-[80px]"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-ink">Billing Rules</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Invoice Due Days">
              <NumberInput
                value={form.dueDays}
                decimals={0}
                onChange={(n) => setForm({ ...form, dueDays: n })}
              />
            </Field>
            <Field label="Water Tariff (RM / m³)">
              <NumberInput
                value={form.waterTariff}
                decimals={2}
                onChange={(n) => setForm({ ...form, waterTariff: n })}
              />
            </Field>
            <Field label="LPI Rate (% per annum)">
              <NumberInput
                value={form.lpiRatePct}
                decimals={2}
                onChange={(n) => setForm({ ...form, lpiRatePct: n })}
              />
            </Field>
            <Field label="LPI Grace Period (days)">
              <NumberInput
                value={form.lpiGraceDays}
                decimals={0}
                onChange={(n) => setForm({ ...form, lpiGraceDays: n })}
              />
            </Field>
            <Field label="SST Rate (%)">
              <NumberInput
                value={form.sstRatePct}
                decimals={2}
                onChange={(n) => setForm({ ...form, sstRatePct: n })}
              />
            </Field>
            <Field label="SST Registration No">
              <input
                className="input"
                value={form.sstRegNo}
                onChange={(e) => setForm({ ...form, sstRegNo: e.target.value })}
              />
            </Field>
          </div>
          <p className="mt-4 rounded-lg bg-cream px-3 py-2 text-xs leading-relaxed text-soot/70">
            LPI and SST here are the <span className="font-semibold">defaults</span>.
            Each billing code can override whether it charges LPI and whether SST
            applies (Billing Codes → edit). SST is added to taxable charges at
            billing time; LPI is applied from the{" "}
            <span className="font-semibold">Outstanding</span> page.
          </p>
        </div>
      </div>
    </div>
  );
}
