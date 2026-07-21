"use client";

import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AnnouncementsPage() {
  const { state } = useStore();
  const rows = [...state.announcements].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div>
      <PageHeader
        title="News & Announcements"
        subtitle="Letters and notices for residents — like the CSS Letter & Correspondence screen"
        actions={
          <Link href="/community/announcements/new" className="btn-primary">
            + New Letter
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((a) => (
          <Link
            key={a.id}
            href={`/community/announcements/${encodeURIComponent(a.id)}/edit`}
            className="card group flex flex-col p-5 transition-shadow hover:shadow-raised"
          >
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
              <span className="text-xs font-bold text-clay-500 opacity-0 transition-opacity group-hover:opacity-100">
                Edit →
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-soot line-clamp-4">
              {a.body.length > 220 ? a.body.slice(0, 220) + "…" : a.body}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
