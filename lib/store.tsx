"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Allocation,
  Announcement,
  AppState,
  BillingCode,
  DocType,
  Invoice,
  Lot,
  Owner,
  Parcel,
  ParkingBay,
  Receipt,
  Settings,
} from "./types";
import { buildSeed } from "./seed";
import { addDays, daysBetween, todayISO } from "./format";

const STORAGE_KEY = "rumahku-data-v1";

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "reset" }
  | { type: "upsertLot"; lot: Lot }
  | { type: "upsertOwner"; owner: Owner }
  | { type: "upsertCode"; code: BillingCode }
  | { type: "updateSettings"; settings: Settings }
  | {
      type: "postInvoices";
      docType: DocType;
      lines: Omit<Invoice, "id" | "docNum" | "balance">[];
      groupByLot?: boolean;
    }
  | { type: "postReceipt"; lotId: string; date: string; mode: Receipt["mode"]; refNum: string; amount: number; allocations: Allocation[]; remarks: string }
  | { type: "updateMeter"; lotId: string; date: string; reading: number }
  | { type: "refundDeposit"; invoiceId: string; date: string; mode: "Cash" | "Cheque" | "Online Banking"; refNum: string }
  | { type: "upsertAnnouncement"; announcement: Announcement }
  | { type: "deleteAnnouncement"; id: string }
  | { type: "addParcel"; parcel: Omit<Parcel, "id"> }
  | { type: "collectParcel"; id: string; by: string; at: string }
  | { type: "assignBay"; bayId: string; lotId: string; plate: string; sticker: string; monthly: number }
  | { type: "releaseBay"; bayId: string };

function nextDoc(state: AppState, docType: DocType | "OR" | "PV"): [string, AppState] {
  const seq = { ...state.seq };
  const n = seq[docType] ?? 1;
  seq[docType] = n + 1;
  const num = `${docType}-${String(10000000 + n).slice(1)}`;
  return [num, { ...state, seq }];
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "reset":
      return buildSeed();
    case "upsertLot": {
      const exists = state.lots.some((l) => l.id === action.lot.id);
      const lots = exists
        ? state.lots.map((l) => (l.id === action.lot.id ? action.lot : l))
        : [...state.lots, action.lot];
      const meters = state.meters.some((m) => m.lotId === action.lot.id)
        ? state.meters
        : [
            ...state.meters,
            {
              lotId: action.lot.id,
              meterNo: `WM${String(88000 + state.meters.length)}`,
              lastDate: null,
              lastReading: 0,
            },
          ];
      return { ...state, lots, meters };
    }
    case "upsertOwner": {
      const exists = state.owners.some((o) => o.id === action.owner.id);
      const owners = exists
        ? state.owners.map((o) => (o.id === action.owner.id ? action.owner : o))
        : [...state.owners, action.owner];
      return { ...state, owners };
    }
    case "upsertCode": {
      const exists = state.codes.some((c) => c.code === action.code.code);
      const codes = exists
        ? state.codes.map((c) => (c.code === action.code.code ? action.code : c))
        : [...state.codes, action.code];
      return { ...state, codes };
    }
    case "updateSettings":
      return { ...state, settings: action.settings };
    case "postInvoices": {
      let s = state;
      const newInvoices: Invoice[] = [];
      // apply SST for taxable codes: amount becomes gross (base + tax)
      const withTax = (line: Omit<Invoice, "id" | "docNum" | "balance">) => {
        const code = s.codes.find((c) => c.code === line.code);
        if (!code || !code.taxable) return { ...line, sst: 0 };
        const base = line.amount;
        const tax = Math.round(base * (s.settings.sstRatePct / 100) * 100) / 100;
        return { ...line, amount: Math.round((base + tax) * 100) / 100, sst: tax };
      };
      if (action.groupByLot) {
        // one document per lot, items share docNum
        const byLot = new Map<string, typeof action.lines>();
        for (const line of action.lines) {
          const list = byLot.get(line.lotId) ?? [];
          list.push(line);
          byLot.set(line.lotId, list);
        }
        byLot.forEach((lines) => {
          const [docNum, s2] = nextDoc(s, action.docType);
          s = s2;
          lines.forEach((raw, idx) => {
            const line = withTax(raw);
            newInvoices.push({
              ...line,
              id: `${docNum}-${idx + 1}`,
              docNum,
              balance: line.amount,
            });
          });
        });
      } else {
        for (const raw of action.lines) {
          const line = withTax(raw);
          const [docNum, s2] = nextDoc(s, action.docType);
          s = s2;
          newInvoices.push({
            ...line,
            id: `${docNum}-1`,
            docNum,
            balance: line.amount,
          });
        }
      }
      return { ...s, invoices: [...s.invoices, ...newInvoices] };
    }
    case "postReceipt": {
      const [docNum, s] = nextDoc(state, "OR");
      const receipt: Receipt = {
        id: docNum,
        docNum,
        lotId: action.lotId,
        date: action.date,
        mode: action.mode,
        refNum: action.refNum,
        amount: action.amount,
        allocations: action.allocations,
        remarks: action.remarks,
      };
      const allocMap = new Map(
        action.allocations.map((a) => [a.invoiceId, a.amount])
      );
      const invoices = s.invoices.map((inv) => {
        const alloc = allocMap.get(inv.id);
        if (!alloc) return inv;
        return { ...inv, balance: Math.max(0, Math.round((inv.balance - alloc) * 100) / 100) };
      });
      return { ...s, invoices, receipts: [...s.receipts, receipt] };
    }
    case "updateMeter": {
      const meters = state.meters.map((m) =>
        m.lotId === action.lotId
          ? { ...m, lastDate: action.date, lastReading: action.reading }
          : m
      );
      return { ...state, meters };
    }
    case "refundDeposit": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv) return state;
      const [docNum, s] = nextDoc(state, "PV");
      return {
        ...s,
        vouchers: [
          ...s.vouchers,
          {
            id: docNum,
            docNum,
            lotId: inv.lotId,
            date: action.date,
            amount: inv.amount,
            mode: action.mode,
            refNum: action.refNum,
            description: `${inv.description} REFUND`,
            invoiceId: inv.id,
          },
        ],
      };
    }
    case "upsertAnnouncement": {
      const exists = state.announcements.some(
        (a) => a.id === action.announcement.id
      );
      const announcements = exists
        ? state.announcements.map((a) =>
            a.id === action.announcement.id ? action.announcement : a
          )
        : [...state.announcements, action.announcement];
      return { ...state, announcements };
    }
    case "deleteAnnouncement":
      return {
        ...state,
        announcements: state.announcements.filter((a) => a.id !== action.id),
      };
    case "addParcel": {
      const id = `PCL-${String(state.parcels.length + 1).padStart(4, "0")}`;
      return { ...state, parcels: [...state.parcels, { ...action.parcel, id }] };
    }
    case "collectParcel":
      return {
        ...state,
        parcels: state.parcels.map((p) =>
          p.id === action.id
            ? {
                ...p,
                status: "Collected",
                collectedAt: action.at,
                collectedBy: action.by,
              }
            : p
        ),
      };
    case "assignBay":
      return {
        ...state,
        bays: state.bays.map((b) =>
          b.id === action.bayId
            ? {
                ...b,
                assignedLotId: action.lotId,
                plate: action.plate,
                sticker: action.sticker,
                monthly: action.monthly,
              }
            : b
        ),
      };
    case "releaseBay":
      return {
        ...state,
        bays: state.bays.map((b) =>
          b.id === action.bayId
            ? { ...b, assignedLotId: null, plate: "", sticker: "", monthly: 0 }
            : b
        ),
      };
    default:
      return state;
  }
}

const StoreCtx = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as never, buildSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.lots && parsed.settings) {
          // merge with seed defaults so older saved data gains new fields.
          // `c` is typed as the current BillingCode, but data saved by an
          // older build won't actually have the new keys at runtime — so we
          // read each field with a fallback (via `any`) rather than spreading.
          const seed = buildSeed();
          const codes: BillingCode[] = (parsed.codes ?? seed.codes).map(
            (raw): BillingCode => {
              const c = raw as Partial<BillingCode> & { code: string };
              const seedMatch = seed.codes.find((s) => s.code === c.code);
              return {
                code: c.code,
                docType: c.docType ?? seedMatch?.docType ?? "IV",
                description: c.description ?? seedMatch?.description ?? "",
                method: c.method ?? seedMatch?.method ?? "fixed",
                rate: c.rate ?? seedMatch?.rate ?? 0,
                frequency: c.frequency ?? seedMatch?.frequency ?? "One-off",
                debitAcc: c.debitAcc ?? seedMatch?.debitAcc ?? "",
                creditAcc: c.creditAcc ?? seedMatch?.creditAcc ?? "",
                active: c.active ?? seedMatch?.active ?? true,
                dueDays: c.dueDays ?? parsed.settings?.dueDays ?? 14,
                lpiChargeable: c.lpiChargeable ?? seedMatch?.lpiChargeable ?? false,
                lpiRate: c.lpiRate ?? seedMatch?.lpiRate ?? 0,
                lpiGrace: c.lpiGrace ?? parsed.settings?.lpiGraceDays ?? 14,
                lpiSkip: c.lpiSkip ?? 0,
                lpiMin: c.lpiMin ?? 0,
                taxable: c.taxable ?? seedMatch?.taxable ?? false,
                sstCode: c.sstCode ?? seedMatch?.sstCode ?? "EX",
                postConsolidated:
                  c.postConsolidated ?? seedMatch?.postConsolidated ?? false,
                offset: c.offset ?? seedMatch?.offset ?? true,
              };
            }
          );
          dispatch({
            type: "hydrate",
            state: {
              ...seed,
              ...parsed,
              codes,
              settings: { ...seed.settings, ...parsed.settings },
              vouchers: parsed.vouchers ?? seed.vouchers,
              announcements: parsed.announcements ?? seed.announcements,
              parcels: parsed.parcels ?? seed.parcels,
              bays: parsed.bays ?? seed.bays,
              seq: { ...seed.seq, ...parsed.seq },
            },
          });
        }
      }
    } catch {
      /* corrupt cache — keep seed */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full — ignore */
    }
  }, [state, ready]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* ------------------------- derived helpers ------------------------- */

export function useLotOwner(lotId: string | null) {
  const { state } = useStore();
  if (!lotId) return undefined;
  return state.owners.find((o) => o.lotIds.includes(lotId) && o.status === "Active");
}

export interface LedgerEntry {
  date: string;
  docNum: string;
  description: string;
  debit: number;
  credit: number;
}

export function lotLedger(state: AppState, lotId: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (const inv of state.invoices) {
    if (inv.lotId !== lotId) continue;
    entries.push({
      date: inv.date,
      docNum: inv.docNum,
      description: inv.description,
      debit: inv.amount,
      credit: 0,
    });
  }
  for (const r of state.receipts) {
    if (r.lotId !== lotId) continue;
    entries.push({
      date: r.date,
      docNum: r.docNum,
      description: "PAYMENT RECEIPT",
      debit: 0,
      credit: r.amount,
    });
  }
  entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.docNum.localeCompare(b.docNum)
  );
  return entries;
}

export function outstandingForLot(state: AppState, lotId: string): Invoice[] {
  return state.invoices
    .filter((i) => i.lotId === lotId && i.balance > 0.004)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function agingBuckets(state: AppState, lotId: string) {
  const today = todayISO();
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
  for (const inv of outstandingForLot(state, lotId)) {
    const overdue = daysBetween(inv.dueDate, today);
    if (overdue <= 0) buckets.current += inv.balance;
    else if (overdue <= 30) buckets.d30 += inv.balance;
    else if (overdue <= 60) buckets.d60 += inv.balance;
    else buckets.d90 += inv.balance;
  }
  return buckets;
}

/** Build LPI (late payment interest) lines for overdue invoices. */
export function computeLPI(state: AppState) {
  const today = todayISO();
  const already = new Set(
    state.invoices
      .filter((i) => i.docType === "IA")
      .map((i) => i.description.match(/-([A-Z]+-\d+-\d+)$/)?.[1] ?? "")
  );
  const lines: Omit<Invoice, "id" | "docNum" | "balance">[] = [];
  for (const inv of state.invoices) {
    if (inv.docType === "IA" || inv.balance <= 0.004) continue;
    if (already.has(inv.id)) continue;
    // per-code LPI settings, falling back to the global defaults
    const code = state.codes.find((c) => c.code === inv.code);
    if (code && !code.lpiChargeable) continue; // code explicitly not chargeable
    const grace = code?.lpiGrace ?? state.settings.lpiGraceDays;
    const ratePct = code?.lpiChargeable ? code.lpiRate : state.settings.lpiRatePct;
    const overdue = daysBetween(inv.dueDate, today) - grace;
    if (overdue <= 0) continue;
    let lpi =
      Math.round(((inv.balance * (ratePct / 100)) / 365) * overdue * 100) / 100;
    if (code && code.lpiMin > 0) lpi = Math.max(lpi, code.lpiMin);
    if (lpi < 0.01) continue;
    lines.push({
      lotId: inv.lotId,
      date: today,
      dueDate: addDays(today, state.settings.dueDays),
      code: "IA",
      docType: "IA",
      description: `LATE PMT CHRG -${inv.code}-${inv.id}`,
      amount: lpi,
      periodStart: inv.dueDate,
      periodEnd: today,
    });
  }
  return lines;
}
