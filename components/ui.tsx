"use client";

import React from "react";
import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="no-print mb-3 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.href && !last ? (
              <Link
                href={it.href}
                className="font-medium text-soot/70 hover:text-clay-500"
              >
                {it.label}
              </Link>
            ) : (
              <span
                className={last ? "font-semibold text-ink" : "text-soot/70"}
                aria-current={last ? "page" : undefined}
              >
                {it.label}
              </span>
            )}
            {!last && (
              <svg
                className="text-soot/30"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Numeric text field — no spinner arrows. Input is validated with a regex so
 * only digits and up to `decimals` decimal places can be typed (default 2).
 */
export function NumberInput({
  value,
  onChange,
  decimals = 2,
  className = "input",
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  decimals?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = React.useState(value ? String(value) : "");
  // reflect external value changes (form reset, method switch, etc.) without
  // clobbering a partial entry like "12." that still parses to the same number
  React.useEffect(() => {
    const cur = text === "" || text === "." ? 0 : parseFloat(text);
    if (cur !== value) setText(value ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const re =
    decimals > 0
      ? new RegExp(`^\\d*(\\.\\d{0,${decimals}})?$`)
      : /^\d*$/;

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || re.test(v)) {
          setText(v);
          onChange(v === "" || v === "." ? 0 : parseFloat(v));
        }
      }}
      onBlur={() => {
        if (text.endsWith(".")) setText(text.slice(0, -1));
      }}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3 lg:mb-6">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-ink lg:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-soot/80">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-soot/60">
        {label}
      </p>
      <p
        className={
          "mt-2 font-display text-xl font-bold tracking-tight lg:text-2xl " +
          (tone === "good"
            ? "text-sage-600"
            : tone === "bad"
              ? "text-danger-600"
              : "text-ink")
        }
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-soot/60">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn" | "clay";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-cream text-soot border-line",
    good: "bg-sage-100 text-sage-700 border-sage-600/20",
    bad: "bg-danger-50 text-danger-700 border-danger-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    clay: "bg-clay-500 text-lime-400 border-clay-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full ${wide ? "w-full max-w-2xl" : "w-full max-w-md"} flex-col border-l border-line bg-paper shadow-raised`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-soot hover:bg-cream"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="bottom-safe flex items-center justify-end gap-2 border-t border-line px-4 pt-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-500">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v9h14v-9" />
        </svg>
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-soot/70">{hint}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soot/40"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="input pl-9"
        value={value}
        placeholder={placeholder ?? "Search…"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
