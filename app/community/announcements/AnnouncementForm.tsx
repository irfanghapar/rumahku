"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs, Field, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Announcement } from "@/lib/types";

function blankLetter(n: number): Announcement {
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

export default function AnnouncementForm({ id }: { id?: string }) {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const isNew = !id;
  const record = id ? state.announcements.find((a) => a.id === id) : undefined;

  const [form, setForm] = useState<Announcement | null>(
    isNew ? blankLetter(state.announcements.length + 1) : record ?? null
  );
  useEffect(() => {
    if (!isNew && form === null && record) setForm(record);
  }, [record, isNew, form]);

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: "Community" },
        { label: "Announcements", href: "/community/announcements" },
        { label: isNew ? "New letter" : record?.code ?? "Edit" },
      ]}
    />
  );

  if (!isNew && !form) {
    return (
      <div>
        {crumbs}
        <p className="card p-8 text-center text-sm text-soot/60">Loading letter…</p>
      </div>
    );
  }
  const f = form!;
  const set = (patch: Partial<Announcement>) => setForm({ ...f, ...patch });

  function save() {
    if (!f.title) return;
    dispatch({ type: "upsertAnnouncement", announcement: f });
    router.push("/community/announcements");
  }
  function remove() {
    if (isNew) return;
    dispatch({ type: "deleteAnnouncement", id: f.id });
    router.push("/community/announcements");
  }

  return (
    <div>
      {crumbs}
      <PageHeader
        title={isNew ? "New Letter" : `Edit ${f.code}`}
        subtitle="Letters and notices for residents"
        actions={
          <>
            {!isNew && (
              <button
                className="btn-secondary mr-auto !text-danger-600"
                onClick={remove}
              >
                Delete
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => router.push("/community/announcements")}
            >
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={!f.title}>
              Save Letter
            </button>
          </>
        }
      />

      <div className="card p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Letter Description (Title)" className="sm:col-span-2">
            <input
              className="input"
              value={f.title}
              placeholder="e.g. Notice of AGM 2026"
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Letter Code">
            <input
              className="input"
              value={f.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="input"
              value={f.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </Field>
          <Field label="REF">
            <input
              className="input"
              value={f.refText}
              onChange={(e) => set({ refText: e.target.value })}
            />
          </Field>
          <Field label="Audience">
            <select
              className="input"
              value={f.audience}
              onChange={(e) =>
                set({ audience: e.target.value as Announcement["audience"] })
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
              value={f.published ? "Published" : "Draft"}
              onChange={(e) => set({ published: e.target.value === "Published" })}
            >
              <option>Draft</option>
              <option>Published</option>
            </select>
          </Field>
          <Field label="Letter Body" className="sm:col-span-2">
            <textarea
              className="input min-h-[260px] leading-relaxed"
              value={f.body}
              onChange={(e) => set({ body: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
          <button
            className="btn-secondary"
            onClick={() => router.push("/community/announcements")}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!f.title}>
            Save Letter
          </button>
        </div>
      </div>
    </div>
  );
}
