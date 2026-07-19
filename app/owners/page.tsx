"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Drawer,
  Field,
  PageHeader,
  SearchInput,
} from "@/components/ui";
import { fmtDate, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Owner } from "@/lib/types";

function newOwner(state: { owners: Owner[] }): Owner {
  const n = state.owners.length + 1;
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

export default function OwnersPage() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Owner | null>(null);
  const [isNew, setIsNew] = useState(false);

  const rows = useMemo(
    () =>
      state.owners
        .filter(
          (o) =>
            o.name.toLowerCase().includes(q.toLowerCase()) ||
            o.lotIds.some((l) => l.toLowerCase().includes(q.toLowerCase())) ||
            o.nric.includes(q)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.owners, q]
  );

  const vacantLots = state.lots
    .filter(
      (l) =>
        !state.owners.some(
          (o) =>
            o.status === "Active" &&
            o.lotIds.includes(l.id) &&
            o.id !== editing?.id
        )
    )
    .map((l) => l.id)
    .sort();

  function save() {
    if (!editing || !editing.name || editing.lotIds.length === 0) return;
    dispatch({ type: "upsertOwner", owner: editing });
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Ownership Entry"
        subtitle="Owners registered against lots, with contact information"
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(newOwner(state));
              setIsNew(true);
            }}
          >
            + New Entry
          </button>
        }
      />

      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search name, NRIC or lot…"
          />
        </div>
        <p className="ml-auto text-xs text-soot/60">
          {rows.length} owners · {vacantLots.length} vacant lots
        </p>
      </div>

      <div className="table-card">
        <table className="w-full">
          <thead className="border-b border-line bg-cream/60">
            <tr>
              <th className="th">Owner</th>
              <th className="th">NRIC / ROC</th>
              <th className="th">Lot(s)</th>
              <th className="th">Contact</th>
              <th className="th">Ownership Date</th>
              <th className="th">Status</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-line/60 last:border-0 hover:bg-cream/40">
                <td className="td">
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-soot/60">{o.id}</p>
                </td>
                <td className="td text-soot/80">{o.nric}</td>
                <td className="td">
                  {o.lotIds.map((l) => (
                    <Badge key={l} tone="neutral">
                      {l}
                    </Badge>
                  ))}
                </td>
                <td className="td">
                  <p className="text-sm">{o.phone}</p>
                  <p className="text-xs text-soot/60">{o.email}</p>
                </td>
                <td className="td">{fmtDate(o.since)}</td>
                <td className="td">
                  <Badge tone={o.status === "Active" ? "good" : "bad"}>
                    {o.status}
                  </Badge>
                </td>
                <td className="td text-right">
                  <button
                    className="btn-ghost !px-2 !py-1 text-xs"
                    onClick={() => {
                      setEditing({ ...o });
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
        title={isNew ? "New Ownership Entry" : `Edit ${editing?.name}`}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={!editing?.name || editing?.lotIds.length === 0}
            >
              Accept
            </button>
          </>
        }
      >
        {editing && (
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-soot/60">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact Code">
                <input
                  className="input"
                  value={editing.contactCode ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, contactCode: e.target.value })
                  }
                />
              </Field>
              <Field label="Contact Is A Company">
                <select
                  className="input"
                  value={editing.isCompany ? "Yes" : "No"}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      isCompany: e.target.value === "Yes",
                    })
                  }
                >
                  <option>No</option>
                  <option>Yes</option>
                </select>
              </Field>
              <Field label="Name" className="sm:col-span-2">
                <input
                  className="input"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </Field>
              <Field label="NRIC / Passport / ROC">
                <input
                  className="input"
                  value={editing.nric}
                  onChange={(e) =>
                    setEditing({ ...editing, nric: e.target.value })
                  }
                />
              </Field>
              <Field label="Date Of Birth">
                <input
                  type="date"
                  className="input"
                  value={editing.dob ?? ""}
                  onChange={(e) => setEditing({ ...editing, dob: e.target.value })}
                />
              </Field>
              <Field label="Salutation">
                <select
                  className="input"
                  value={editing.salute ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, salute: e.target.value })
                  }
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
                  value={editing.sex ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sex: e.target.value as Owner["sex"],
                    })
                  }
                >
                  <option value="">—</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </Field>
              <Field label="Ethnic">
                <select
                  className="input"
                  value={editing.ethnic ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, ethnic: e.target.value })
                  }
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
                  value={editing.religion ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, religion: e.target.value })
                  }
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
                  value={editing.marital ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, marital: e.target.value })
                  }
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
                  value={editing.nationality ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, nationality: e.target.value })
                  }
                />
              </Field>
              <Field label="Bumi Status">
                <select
                  className="input"
                  value={editing.bumi ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      bumi: e.target.value as Owner["bumi"],
                    })
                  }
                >
                  <option value="">—</option>
                  <option>Bumi</option>
                  <option>Non-Bumi</option>
                </select>
              </Field>
              <Field label="Mail Method">
                <select
                  className="input"
                  value={editing.mailMethod ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      mailMethod: e.target.value as Owner["mailMethod"],
                    })
                  }
                >
                  <option value="">—</option>
                  <option>Email</option>
                  <option>Post</option>
                  <option>SMS</option>
                </select>
              </Field>
              {editing.isCompany && (
                <>
                  <Field label="Company / ROC Num">
                    <input
                      className="input"
                      value={editing.companyNum ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, companyNum: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="SST / GST Reg Num">
                    <input
                      className="input"
                      value={editing.gstRegNo ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, gstRegNo: e.target.value })
                      }
                    />
                  </Field>
                </>
              )}
              <Field label="Designation">
                <input
                  className="input"
                  value={editing.designation ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, designation: e.target.value })
                  }
                />
              </Field>
              <Field label="Email">
                <input
                  className="input"
                  value={editing.email}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Telephone 1">
                <input
                  className="input"
                  value={editing.phone}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="Telephone 2">
                <input
                  className="input"
                  value={editing.phone2 ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, phone2: e.target.value })
                  }
                />
              </Field>
              <Field label="Telephone 3">
                <input
                  className="input"
                  value={editing.phone3 ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, phone3: e.target.value })
                  }
                />
              </Field>
              <Field label="Fax">
                <input
                  className="input"
                  value={editing.fax ?? ""}
                  onChange={(e) => setEditing({ ...editing, fax: e.target.value })}
                />
              </Field>
              <Field label="Mailing Address" className="sm:col-span-2">
                <textarea
                  className="input min-h-[70px]"
                  value={editing.address}
                  onChange={(e) =>
                    setEditing({ ...editing, address: e.target.value })
                  }
                />
              </Field>
            </div>

            <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-soot/60">
              Ownership
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ownership Date">
                <input
                  type="date"
                  className="input"
                  value={editing.since}
                  onChange={(e) =>
                    setEditing({ ...editing, since: e.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <select
                  className="input"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as Owner["status"],
                    })
                  }
                >
                  <option>Active</option>
                  <option>Terminated</option>
                </select>
              </Field>
              <Field label="Lots Owned" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-cream/40 p-3">
                  {editing.lotIds.map((l) => (
                    <button
                      key={l}
                      className="inline-flex items-center gap-1 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-white"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          lotIds: editing.lotIds.filter((x) => x !== l),
                        })
                      }
                    >
                      {l} ✕
                    </button>
                  ))}
                  <select
                    className="input !w-40 !py-1 text-xs"
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setEditing({
                        ...editing,
                        lotIds: [...editing.lotIds, e.target.value],
                      });
                    }}
                  >
                    <option value="">+ Assign lot…</option>
                    {vacantLots
                      .filter((l) => !editing.lotIds.includes(l))
                      .map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                  </select>
                </div>
              </Field>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
