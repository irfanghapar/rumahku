"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Field, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Owner } from "@/lib/types";

function blankOwner(n: number): Owner {
  return {
    id: `OWN-${String(n).padStart(3, "0")}`,
    name: "",
    nric: "",
    email: "",
    phone: "",
    lotIds: [],
    since: todayISO(),
    isCompany: false,
    address: "",
    status: "Active",
    contactCode: `C${String(1000 + n)}`,
    dob: "",
    salute: "",
    sex: "",
    ethnic: "",
    religion: "",
    marital: "",
    nationality: "Malaysian",
    bumi: "",
    mailMethod: "Email",
    companyNum: "",
    gstRegNo: "",
    designation: "",
    phone2: "",
    phone3: "",
    fax: "",
  };
}

export default function OwnerForm({ ownerId }: { ownerId?: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const isNew = !ownerId;
  const record = ownerId ? state.owners.find((o) => o.id === ownerId) : undefined;

  const [form, setForm] = useState<Owner | null>(
    isNew ? blankOwner(state.owners.length + 1) : record ?? null
  );
  useEffect(() => {
    if (!isNew && form === null && record) setForm(record);
  }, [record, isNew, form]);

  const vacantLots = useMemo(
    () =>
      state.lots
        .filter(
          (l) =>
            !state.owners.some(
              (o) =>
                o.status === "Active" &&
                o.lotIds.includes(l.id) &&
                o.id !== form?.id
            )
        )
        .map((l) => l.id)
        .sort(),
    [state.lots, state.owners, form?.id]
  );

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: "Ownership" },
        { label: "Owners", href: "/owners" },
        { label: isNew ? "New entry" : record?.name ?? "Edit" },
      ]}
    />
  );

  if (!isNew && !form) {
    return (
      <div>
        {crumbs}
        <p className="card p-8 text-center text-sm text-soot/60">Loading owner…</p>
      </div>
    );
  }
  const f = form!;
  const set = (patch: Partial<Owner>) => setForm({ ...f, ...patch });

  function save() {
    if (!f.name || f.lotIds.length === 0) return;
    dispatch({ type: "upsertOwner", owner: f });
    router.push("/owners");
  }

  const actions = (
    <>
      <button className="btn-secondary" onClick={() => router.push("/owners")}>
        Cancel
      </button>
      <button
        className="btn-primary"
        onClick={save}
        disabled={!f.name || f.lotIds.length === 0}
      >
        Save Owner
      </button>
    </>
  );

  return (
    <div>
      {crumbs}
      <PageHeader
        title={isNew ? "New Ownership Entry" : `Edit ${f.name || f.id}`}
        subtitle="Owner registered against lots, with contact information"
        actions={actions}
      />

      <div className="card p-5 sm:p-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-soot/60">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Contact Code">
            <input
              className="input"
              value={f.contactCode ?? ""}
              onChange={(e) => set({ contactCode: e.target.value })}
            />
          </Field>
          <Field label="Contact Is A Company">
            <select
              className="input"
              value={f.isCompany ? "Yes" : "No"}
              onChange={(e) => set({ isCompany: e.target.value === "Yes" })}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </Field>
          <Field label="NRIC / Passport / ROC">
            <input
              className="input"
              value={f.nric}
              onChange={(e) => set({ nric: e.target.value })}
            />
          </Field>
          <Field label="Name" className="sm:col-span-2 lg:col-span-3">
            <input
              className="input"
              value={f.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </Field>
          <Field label="Date Of Birth">
            <input
              type="date"
              className="input"
              value={f.dob ?? ""}
              onChange={(e) => set({ dob: e.target.value })}
            />
          </Field>
          <Field label="Salutation">
            <select
              className="input"
              value={f.salute ?? ""}
              onChange={(e) => set({ salute: e.target.value })}
            >
              <option value="">—</option>
              {["Mr", "Ms", "Mrs", "Encik", "Puan", "Dr", "Dato'", "Datin"].map(
                (s) => (
                  <option key={s}>{s}</option>
                )
              )}
            </select>
          </Field>
          <Field label="Sex">
            <select
              className="input"
              value={f.sex ?? ""}
              onChange={(e) => set({ sex: e.target.value as Owner["sex"] })}
            >
              <option value="">—</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Ethnic">
            <select
              className="input"
              value={f.ethnic ?? ""}
              onChange={(e) => set({ ethnic: e.target.value })}
            >
              <option value="">—</option>
              {["Malay", "Chinese", "Indian", "Others"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Religion">
            <select
              className="input"
              value={f.religion ?? ""}
              onChange={(e) => set({ religion: e.target.value })}
            >
              <option value="">—</option>
              {["Islam", "Buddhism", "Hinduism", "Christianity", "Others"].map(
                (x) => (
                  <option key={x}>{x}</option>
                )
              )}
            </select>
          </Field>
          <Field label="Marital Status">
            <select
              className="input"
              value={f.marital ?? ""}
              onChange={(e) => set({ marital: e.target.value })}
            >
              <option value="">—</option>
              {["Single", "Married", "Divorced", "Widowed"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Nationality">
            <input
              className="input"
              value={f.nationality ?? ""}
              onChange={(e) => set({ nationality: e.target.value })}
            />
          </Field>
          <Field label="Bumi Status">
            <select
              className="input"
              value={f.bumi ?? ""}
              onChange={(e) => set({ bumi: e.target.value as Owner["bumi"] })}
            >
              <option value="">—</option>
              <option>Bumi</option>
              <option>Non-Bumi</option>
            </select>
          </Field>
          <Field label="Mail Method">
            <select
              className="input"
              value={f.mailMethod ?? ""}
              onChange={(e) =>
                set({ mailMethod: e.target.value as Owner["mailMethod"] })
              }
            >
              <option value="">—</option>
              <option>Email</option>
              <option>Post</option>
              <option>SMS</option>
            </select>
          </Field>
          {f.isCompany && (
            <>
              <Field label="Company / ROC Num">
                <input
                  className="input"
                  value={f.companyNum ?? ""}
                  onChange={(e) => set({ companyNum: e.target.value })}
                />
              </Field>
              <Field label="SST / GST Reg Num">
                <input
                  className="input"
                  value={f.gstRegNo ?? ""}
                  onChange={(e) => set({ gstRegNo: e.target.value })}
                />
              </Field>
            </>
          )}
          <Field label="Designation">
            <input
              className="input"
              value={f.designation ?? ""}
              onChange={(e) => set({ designation: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              value={f.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </Field>
          <Field label="Telephone 1">
            <input
              className="input"
              value={f.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
          </Field>
          <Field label="Telephone 2">
            <input
              className="input"
              value={f.phone2 ?? ""}
              onChange={(e) => set({ phone2: e.target.value })}
            />
          </Field>
          <Field label="Telephone 3">
            <input
              className="input"
              value={f.phone3 ?? ""}
              onChange={(e) => set({ phone3: e.target.value })}
            />
          </Field>
          <Field label="Fax">
            <input
              className="input"
              value={f.fax ?? ""}
              onChange={(e) => set({ fax: e.target.value })}
            />
          </Field>
          <Field label="Mailing Address" className="sm:col-span-2 lg:col-span-3">
            <textarea
              className="input min-h-[70px]"
              value={f.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Field>
        </div>

        <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-soot/60">
          Ownership
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Ownership Date">
            <input
              type="date"
              className="input"
              value={f.since}
              onChange={(e) => set({ since: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={f.status}
              onChange={(e) => set({ status: e.target.value as Owner["status"] })}
            >
              <option>Active</option>
              <option>Terminated</option>
            </select>
          </Field>
          <Field label="Lots Owned" className="sm:col-span-2 lg:col-span-3">
            <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-cream/40 p-3">
              {f.lotIds.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-lime-400"
                  onClick={() =>
                    set({ lotIds: f.lotIds.filter((x) => x !== l) })
                  }
                >
                  {l} ✕
                </button>
              ))}
              <select
                className="input !w-44 !py-1 text-xs"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  set({ lotIds: [...f.lotIds, e.target.value] });
                }}
              >
                <option value="">+ Assign lot…</option>
                {vacantLots
                  .filter((l) => !f.lotIds.includes(l))
                  .map((l) => (
                    <option key={l}>{l}</option>
                  ))}
              </select>
            </div>
            {f.lotIds.length === 0 && (
              <p className="mt-1 text-xs text-danger-600">
                Assign at least one lot.
              </p>
            )}
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          {actions}
        </div>
      </div>
    </div>
  );
}
