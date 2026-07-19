"use client";

import { useMemo, useState } from "react";
import { PROPERTIES, Property, findProperty } from "@/lib/properties";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

/* ---- small inline icons (actions/marks only) ------------------------- */
const Building = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="3" width="14" height="18" rx="1.6" />
    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h6" />
  </svg>
);
const Check = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4.5 4.5L19 7" />
  </svg>
);
const Search = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/* ---- one selectable property card ------------------------------------ */
function PropertyCard({
  p,
  selected,
  onSelect,
}: {
  p: Property;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={
        "group flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition-all " +
        (selected
          ? "border-clay-500 bg-clay-50 shadow-card ring-1 ring-clay-500"
          : "border-line bg-paper hover:border-clay-200 hover:bg-cream")
      }
    >
      {/* thumbnail */}
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${p.accent} 0%, ${p.accent}cc 55%, ${p.accent}88 100%)`,
        }}
      >
        <Building className="h-7 w-7 opacity-90" />
        <span className="absolute bottom-1 right-1 rounded bg-black/25 px-1 text-[9px] font-bold tracking-wide">
          {p.code}
        </span>
      </div>

      {/* text */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{p.name}</p>
        <p className="mt-0.5 truncate text-xs text-soot/70">
          {p.location} · {p.units} units
        </p>
        <span
          className={
            "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-soot/70 " +
            (selected ? "bg-paper" : "bg-cream")
          }
        >
          {p.tag}
        </span>
      </div>

      {/* selection mark */}
      <span
        className={
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all " +
          (selected
            ? "border-clay-500 bg-clay-500 text-lime-400"
            : "border-line text-transparent")
        }
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

/* ---- the animated right-hand visual ---------------------------------- */
function VisualPanel({ property }: { property: Property }) {
  return (
    <div className="relative hidden overflow-hidden bg-clay-500 lg:flex lg:w-1/2">
      {/* drifting lime aurora */}
      <div
        className="rmk-drift pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(159,232,112,0.30) 0%, rgba(159,232,112,0) 70%)" }}
      />
      <div
        className="rmk-drift-2 pointer-events-none absolute -bottom-20 left-1/4 h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(159,232,112,0.16) 0%, rgba(159,232,112,0) 70%)" }}
      />
      {/* faint animated grid */}
      <div
        className="rmk-grid-pan pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 40%, transparent 80%)",
        }}
      />

      {/* content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
        <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-lime-300">
          Rumahku · Admin
        </p>
        <h2 className="text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
          Every unit,
          <br />
          every ringgit —
          <br />
          <span className="italic text-lime-400">in one place.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-lime-100/70">
          Billing, receipts, deposits, parcels and parking for your whole
          scheme — one calm console.
        </p>

        {/* floating glass card — mirrors the selected property */}
        <div className="rmk-float mt-10 w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${property.accent}, ${property.accent}aa)` }}
            >
              <Building className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{property.name}</p>
              <p className="truncate text-xs text-lime-100/60">
                {property.location}
              </p>
            </div>
            <span className="ml-auto rounded-full bg-lime-400 px-2.5 py-1 text-[11px] font-bold text-clay-500">
              {property.code}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[11px] text-lime-100/60">Total units</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-white">
                {property.units}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[11px] text-lime-100/60">Managed since</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-white">
                {property.since}
              </p>
            </div>
          </div>

          {/* decorative activity bars */}
          <div className="mt-4">
            <p className="mb-2 text-[11px] text-lime-100/60">Monthly activity</p>
            <div className="flex items-end gap-1.5">
              {[0.5, 0.8, 0.4, 0.95, 0.65, 0.85, 0.55, 1, 0.7].map((h, i) => (
                <div
                  key={i}
                  className="rmk-bar flex-1 rounded-sm bg-lime-400/80"
                  style={{ height: `${h * 40}px`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SVG condo skyline along the bottom */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 w-full"
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        <g opacity="0.5">
          <rect x="40" y="90" width="70" height="110" rx="3" fill="#0e2100" />
          <rect x="130" y="50" width="90" height="150" rx="3" fill="#0e2100" />
          <rect x="240" y="110" width="60" height="90" rx="3" fill="#0e2100" />
          <rect x="500" y="70" width="80" height="130" rx="3" fill="#0e2100" />
          <rect x="600" y="40" width="70" height="160" rx="3" fill="#0e2100" />
          <rect x="690" y="100" width="70" height="100" rx="3" fill="#0e2100" />
        </g>
        {/* lit windows */}
        <g fill="#9FE870" opacity="0.55">
          {[
            [150, 70], [170, 70], [190, 70], [150, 95], [190, 95], [150, 120], [170, 120],
            [620, 60], [640, 60], [620, 85], [640, 85], [620, 110], [640, 110],
            [520, 90], [540, 90], [520, 115], [560, 115],
            [55, 110], [85, 110], [55, 140], [85, 140],
            [705, 120], [730, 120], [705, 150],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="10" height="14" rx="1.5" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ---- the sign-in screen --------------------------------------------- */
export default function LoginScreen() {
  const { signIn } = useSession();
  const { dispatch, state } = useStore();
  const [propertyId, setPropertyId] = useState(PROPERTIES[0].id);
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");

  const selected = findProperty(propertyId);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return PROPERTIES;
    return PROPERTIES.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s) ||
        p.code.toLowerCase().includes(s)
    );
  }, [q]);

  function enter(e?: React.FormEvent) {
    e?.preventDefault();
    const prop = selected;
    dispatch({
      type: "updateSettings",
      settings: {
        ...state.settings,
        propertyName: prop.name,
        propertyCode: prop.code,
        address: prop.address,
        phone: prop.phone,
        email: prop.email,
      },
    });
    signIn({ email: email.trim() || prop.email, propertyId });
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT — brand + house picker + sign in */}
      <div className="relative flex w-full flex-col overflow-hidden bg-cream lg:w-1/2">
        {/* soft brand glows + faint grid */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-96 w-[34rem] -translate-x-1/2 rounded-full bg-lime-400/20 blur-[130px]" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-lime-400/10 blur-[110px]" />
        </div>

        {/* brand */}
        <div className="relative z-10 flex items-center gap-2.5 px-6 pt-6 sm:px-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-500 text-lime-400 shadow-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1v-9.5Z" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight text-ink">Rumahku</p>
            <p className="text-[11px] text-soot/60">Property Management</p>
          </div>
        </div>

        {/* content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <form onSubmit={enter} className="w-full max-w-md">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-soot/70">
              Choose the property you manage, then continue.
            </p>

            {/* search — helps once there are many properties */}
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soot/40" />
              <input
                className="input pl-9"
                placeholder="Search property, code or location…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* property picker */}
            <div
              role="radiogroup"
              aria-label="Choose property"
              className="mt-3 space-y-2.5"
            >
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={p}
                  selected={p.id === propertyId}
                  onSelect={() => setPropertyId(p.id)}
                />
              ))}
              {filtered.length === 0 && (
                <p className="rounded-xl bg-cream px-3 py-6 text-center text-sm text-soot/60">
                  No property matches “{q}”.
                </p>
              )}
            </div>

            {/* email (optional in testing) */}
            <div className="mt-5">
              <label className="label flex items-center justify-between">
                <span>Email</span>
                <span className="font-normal normal-case tracking-normal text-soot/40">
                  optional for testing
                </span>
              </label>
              <input
                type="email"
                className="input"
                placeholder={selected.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary mt-4 w-full !py-2.5">
              Continue to {selected.name}
              <span aria-hidden>→</span>
            </button>

            <p className="mt-3 text-center text-xs text-soot/50">
              Testing mode — no password required, any email works.
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT — animated visual, mirrors the selected property */}
      <VisualPanel property={selected} />
    </div>
  );
}
