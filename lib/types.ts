export type LotType = "Apartment" | "Duplex" | "Penthouse" | "Shop";

export interface Lot {
  id: string; // lot number e.g. "A-06-01"
  block: string;
  level: number;
  type: LotType;
  builtUp: number; // sq ft
  shareUnits: number;
  bumi: "Bumi" | "Non-Bumi";
  address: string;
  // extended CSS "Lot Information" fields
  subPhase?: string;
  levelDesc?: string; // Level Dscp (e.g. "Ground", "Podium")
  model?: string;
  landArea?: number; // sq ft (0 for strata units)
  strataNum?: string;
  facing?: string;
  position?: string;
  remarks?: string;
}

export interface Owner {
  id: string;
  name: string;
  nric: string;
  email: string;
  phone: string;
  lotIds: string[];
  since: string; // ISO date
  isCompany: boolean;
  address: string;
  status: "Active" | "Terminated";
  // extended CSS "Contact Information" fields
  contactCode?: string;
  dob?: string; // ISO
  salute?: string; // Mr / Ms / Dato' …
  sex?: "Male" | "Female" | "";
  ethnic?: string;
  religion?: string;
  marital?: string;
  nationality?: string;
  bumi?: "Bumi" | "Non-Bumi" | "";
  mailMethod?: "Email" | "Post" | "SMS" | "";
  companyNum?: string;
  gstRegNo?: string;
  designation?: string;
  phone2?: string;
  phone3?: string;
  fax?: string;
}

export type DocType = "IV" | "UB" | "IA" | "DN" | "CN";

export interface BillingCode {
  code: string; // e.g. IVSC
  docType: DocType;
  description: string;
  method: "rate" | "fixed"; // rate = RM per sq ft, fixed = flat RM
  rate: number;
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "One-off";
  debitAcc: string;
  creditAcc: string;
  active: boolean;
  dueDays: number; // days after invoice date (falls back to settings)
  // late payment interest — configured per code (CSS "LPI" fields)
  lpiChargeable: boolean;
  lpiRate: number; // % per annum
  lpiGrace: number; // grace days before LPI starts
  lpiSkip: number; // skip period in months (0 = none)
  lpiMin: number; // minimum LPI charge (RM)
  // SST — service tax
  taxable: boolean; // SST applies to this charge
  sstCode: "SR" | "OS" | "EX"; // Standard-Rated / Out-of-Scope / Exempt
  // GL posting flags (CSS)
  postConsolidated: boolean; // post consolidated sum to GL
  offset: boolean; // offsettable against payments
}

export interface Invoice {
  id: string;
  docNum: string;
  lotId: string;
  date: string; // ISO
  dueDate: string; // ISO
  code: string; // billing code
  docType: DocType;
  description: string;
  amount: number; // GROSS (base + SST) — the amount owed & allocated against
  balance: number;
  sst?: number; // SST portion of amount (0/undefined when non-taxable)
  periodStart?: string;
  periodEnd?: string;
}

export interface Allocation {
  invoiceId: string;
  amount: number;
}

export interface Receipt {
  id: string;
  docNum: string;
  lotId: string;
  date: string; // ISO
  mode: "Cash" | "Cheque" | "Online Banking" | "Credit Card" | "JomPAY";
  refNum: string;
  amount: number;
  allocations: Allocation[];
  remarks: string;
}

export interface Meter {
  lotId: string;
  meterNo: string;
  lastDate: string | null; // ISO
  lastReading: number;
  lastConsume?: number; // previous period's consumption (m³)
}

/** Payment voucher — money going OUT (e.g. deposit refunds). */
export interface Voucher {
  id: string;
  docNum: string;
  lotId: string;
  date: string; // ISO
  amount: number;
  mode: "Cash" | "Cheque" | "Online Banking";
  refNum: string;
  description: string;
  invoiceId?: string; // the DN (deposit) invoice this refunds
}

export interface Announcement {
  id: string;
  code: string; // letter code e.g. LTR-004
  title: string;
  refText: string;
  body: string;
  date: string; // ISO
  audience: "All Residents" | "Owners" | "Tenants";
  published: boolean;
}

export interface Parcel {
  id: string;
  lotId: string;
  recipient: string;
  courier: string;
  trackingNo: string;
  receivedAt: string; // ISO datetime
  status: "At guardhouse" | "Collected";
  collectedAt?: string;
  collectedBy?: string;
}

export type BayType = "Resident" | "Visitor" | "OKU";

export interface ParkingBay {
  id: string; // e.g. B1-012
  level: string; // B1 / B2
  type: BayType;
  assignedLotId: string | null;
  plate: string;
  sticker: string;
  monthly: number; // RM if rented, 0 if included
}

export interface Settings {
  propertyName: string;
  propertyCode: string;
  address: string;
  phone: string;
  email: string;
  waterTariff: number; // RM per unit (m3)
  lpiRatePct: number; // % per annum (fallback default for new codes)
  lpiGraceDays: number;
  dueDays: number; // days after invoice date
  sstRatePct: number; // service tax rate, e.g. 8
  sstRegNo: string; // SST registration number (printed on tax invoices)
}

export interface Seq {
  IV: number;
  UB: number;
  IA: number;
  DN: number;
  CN: number;
  OR: number;
  PV: number;
}

export interface AppState {
  lots: Lot[];
  owners: Owner[];
  codes: BillingCode[];
  invoices: Invoice[];
  receipts: Receipt[];
  meters: Meter[];
  vouchers: Voucher[];
  announcements: Announcement[];
  parcels: Parcel[];
  bays: ParkingBay[];
  settings: Settings;
  seq: Seq;
}
