export function fmtRM(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return (
    sign +
    "RM " +
    abs.toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtNum(n: number, dp = 2): string {
  return n.toLocaleString("en-MY", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

export function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.floor((b - a) / 86_400_000);
}

export function monthStartISO(year: number, monthIdx0: number): string {
  return `${year}-${String(monthIdx0 + 1).padStart(2, "0")}-01`;
}

export function monthEndISO(year: number, monthIdx0: number): string {
  const d = new Date(year, monthIdx0 + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
