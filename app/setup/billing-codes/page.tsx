"use client";

import { useState } from "react";
import { Badge, Drawer, Field, PageHeader } from "@/components/ui";
import { fmtNum } from "@/lib/format";
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
};

export default function BillingCodesPage() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<string>("All");
  const [editing, setEditing] = useState<BillingCode | null>(null);
  const [isNew, setIsNew] = useState(false);

  const rows = state.codes.filter((c) =>
    filter === "All" ? true : c.docType === filter
  );

  function save() {
    if (!editing || !editing.code || !editing.description) return;
    dispatch({
      type: "upsertCode",
      code: { ...editing, code: editing.code.toUpperCase() },
    });
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Billing Codes"
        subtitle="GL codes that drive every charge — like the CSS GL Code screen"
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing({ ...emptyCode });
              setIsNew(true);
            }}
          >
            + New Code
          </button>
        }
      />

      <div className="no-print mb-4 flex items-center gap-2">
        {["All", "IV", "UB", "IA", "DN", "CN"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
              (filter === t
                ? "border-clay-500 bg-clay-500 text-lime-400"
                : "border-line bg-paper text-soot hover:bg-cream")
            }
          >
            {t}
          </button>
        ))}
        <p className="ml-auto text-xs text-soot/60">{rows.length} codes</p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Code</th>
              <th className="th">Doc</th>
              <th className="th">Item Description</th>
              <th className="th text-right">Rate / Amount</th>
              <th className="th">Frequency</th>
              <th className="th">Debit Acc</th>
              <th className="th">Credit Acc</th>
              <th className="th">Status</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.code} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td font-semibold">{c.code}</td>
                <td className="td">
                  <Badge tone="neutral">{c.docType}</Badge>
                </td>
                <td className="td">{c.description}</td>
                <td className="td text-right">
                  {c.method === "rate"
                    ? `RM ${fmtNum(c.rate, 4)} / sq ft`
                    : `RM ${fmtNum(c.rate)}`}
                </td>
                <td className="td">{c.frequency}</td>
                <td className="td text-soot/70">{c.debitAcc}</td>
                <td className="td text-soot/70">{c.creditAcc}</td>
                <td className="td">
                  <Badge tone={c.active ? "good" : "bad"}>
                    {c.active ? "Active" : "Suspended"}
                  </Badge>
                </td>
                <td className="td text-right">
                  <button
                    className="btn-ghost !px-2 !py-1 text-xs"
                    onClick={() => {
                      setEditing({ ...c });
                      setIsNew(false);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!editing}
        title={isNew ? "New Billing Code" : `Edit ${editing?.code}`}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={!editing?.code || !editing?.description}
            >
              Save Code
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Document Code">
              <select
                className="input"
                value={editing.docType}
                onChange={(e) =>
                  setEditing({ ...editing, docType: e.target.value as DocType })
                }
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
                value={editing.code}
                disabled={!isNew}
                placeholder="e.g. IVSC"
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Item Description" className="sm:col-span-2">
              <input
                className="input"
                value={editing.description}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    description: e.target.value.toUpperCase(),
                  })
                }
              />
            </Field>
            <Field label="Charging Method">
              <select
                className="input"
                value={editing.method}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    method: e.target.value as BillingCode["method"],
                  })
                }
              >
                <option value="fixed">Fixed amount (RM)</option>
                <option value="rate">Rate per sq ft</option>
              </select>
            </Field>
            <Field
              label={editing.method === "rate" ? "Rate (RM / sq ft)" : "Amount (RM)"}
            >
              <input
                type="number"
                step="0.0001"
                className="input"
                value={editing.rate}
                onChange={(e) =>
                  setEditing({ ...editing, rate: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Frequency">
              <select
                className="input"
                value={editing.frequency}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    frequency: e.target.value as BillingCode["frequency"],
                  })
                }
              >
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>One-off</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={editing.active ? "Active" : "Suspended"}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.value === "Active" })
                }
              >
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </Field>
            <Field label="Debit Acctno">
              <input
                className="input"
                value={editing.debitAcc}
                onChange={(e) =>
                  setEditing({ ...editing, debitAcc: e.target.value })
                }
              />
            </Field>
            <Field label="Credit Acctno">
              <input
                className="input"
                value={editing.creditAcc}
                onChange={(e) =>
                  setEditing({ ...editing, creditAcc: e.target.value })
                }
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}
