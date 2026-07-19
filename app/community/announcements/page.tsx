"use client";

import { useState } from "react";
import { Badge, Drawer, Field, PageHeader } from "@/components/ui";
import { fmtDate, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Announcement } from "@/lib/types";

export default function AnnouncementsPage() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [isNew, setIsNew] = useState(false);

  const rows = [...state.announcements].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  function newLetter(): Announcement {
    const n = state.announcements.length + 1;
    return {
      id: `ANN-${String(n).padStart(3, "0")}`,
      code: `LTR-${String(n).padStart(3, "0")}`,
      title: "",
      refText: "",
      body: "Dear All Residents,\n\n",
      date: todayISO(),
      audience: "All Residents",
      published: false,
    };
  }

  function save() {
    if (!editing || !editing.title) return;
    dispatch({ type: "upsertAnnouncement", announcement: editing });
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="News & Announcements"
        subtitle="Letters and notices for residents — like the CSS Letter & Correspondence screen"
        actions={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(newLetter());
              setIsNew(true);
            }}
          >
            + New Letter
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((a) => (
          <div key={a.id} className="card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-ink">{a.title}</h2>
                  <Badge tone={a.published ? "good" : "warn"}>
                    {a.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-soot/60">
                  {a.code} · {fmtDate(a.date)} · {a.audience}
                  {a.refText ? ` · Ref: ${a.refText}` : ""}
                </p>
              </div>
              <button
                className="btn-ghost !px-2 !py-1 text-xs"
                onClick={() => {
                  setEditing({ ...a });
                  setIsNew(false);
                }}
              >
                Edit
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-soot line-clamp-4">
              {a.body.length > 220 ? a.body.slice(0, 220) + "…" : a.body}
            </p>
          </div>
        ))}
      </div>

      <Drawer
        open={!!editing}
        title={isNew ? "New Letter" : `Edit ${editing?.code}`}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            {!isNew && editing && (
              <button
                className="btn-secondary mr-auto !text-danger-600"
                onClick={() => {
                  dispatch({ type: "deleteAnnouncement", id: editing.id });
                  setEditing(null);
                }}
              >
                Delete
              </button>
            )}
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={!editing?.title}
            >
              Save Letter
            </button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Letter Description (Title)" className="sm:col-span-2">
              <input
                className="input"
                value={editing.title}
                placeholder="e.g. Notice of AGM 2026"
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </Field>
            <Field label="Letter Code">
              <input
                className="input"
                value={editing.code}
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value.toUpperCase() })
                }
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className="input"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </Field>
            <Field label="REF">
              <input
                className="input"
                value={editing.refText}
                onChange={(e) =>
                  setEditing({ ...editing, refText: e.target.value })
                }
              />
            </Field>
            <Field label="Audience">
              <select
                className="input"
                value={editing.audience}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    audience: e.target.value as Announcement["audience"],
                  })
                }
              >
                <option>All Residents</option>
                <option>Owners</option>
                <option>Tenants</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={editing.published ? "Published" : "Draft"}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    published: e.target.value === "Published",
                  })
                }
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
            </Field>
            <Field label="Letter Body" className="sm:col-span-2">
              <textarea
                className="input min-h-[220px] leading-relaxed"
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}
