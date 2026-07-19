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
}

export type DocType = "IV" | "UB" | "IA" | "DN" | "CN";

export interface BillingCode {
  code: string; // e.g. IVSC
  docType: DocType;
  description: string;
  method: "rate" | "fixed"; // rate = RM per sq ft, fixed = flat RM
  rate: number;
  frequency: "Monthly" | "Quarterly" | "One-off";
  debitAcc: string;
  creditAcc: string;
  active: boolean;
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
  amount: number;
  balance: number;
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
  lpiRatePct: number; // % per annum
  lpiGraceDays: number;
  dueDays: number; // days after invoice date
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
