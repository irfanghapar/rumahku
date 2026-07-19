import {
  Announcement,
  AppState,
  BillingCode,
  Invoice,
  Lot,
  Meter,
  Owner,
  Parcel,
  ParkingBay,
  Receipt,
  Voucher,
} from "./types";
import { addDays, monthEndISO, monthStartISO } from "./format";

// deterministic pseudo-random so the demo is stable
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const OWNER_NAMES: [string, string][] = [
  ["Ahmad Faizal bin Zulkifli", "800214-14-5231"],
  ["Siti Nurhaliza binti Kamarudin", "851107-10-6244"],
  ["Tan Wei Liang", "790423-08-5117"],
  ["Lim Mei Fong", "880912-14-5620"],
  ["Rajeswari a/p Muniandy", "760830-10-5482"],
  ["Mohd Hafiz bin Ismail", "900518-14-6017"],
  ["Wong Kok Seng", "670225-71-5119"],
  ["Nurul Ain binti Abdullah", "930704-14-5568"],
  ["Kumaresan a/l Subramaniam", "820611-10-6335"],
  ["Chong Li Wei", "861129-14-5220"],
  ["Azlina binti Hashim", "780316-10-5044"],
  ["Dato' Ong Soo Chiong", "620705-10-5015"],
  ["Farah Diyana binti Roslan", "950822-14-5806"],
  ["Lee Chee Keong", "710409-08-5573"],
  ["Hafizah binti Mohd Noor", "890237-14-5122"],
  ["Vijay a/l Ramasamy", "840518-10-6451"],
  ["Ng Sook Yee", "911003-14-5484"],
  ["Khairul Anuar bin Othman", "870726-14-5991"],
  ["Grace Chin Yen Ling", "940215-14-5326"],
  ["Syed Amirul bin Syed Kamal", "830909-14-6103"],
];

export function buildSeed(): AppState {
  // fresh generator per call → buildSeed() is pure & deterministic
  const rand = mulberry32(20260101);

  // ---- lots: Blocks A & B, levels 1-3, units 01-04 --------------------
  const lots: Lot[] = [];
  const sizes = [850, 950, 1100, 1250];
  for (const block of ["A", "B"]) {
    for (let level = 1; level <= 3; level++) {
      for (let unit = 1; unit <= 4; unit++) {
        const id = `${block}-${String(level).padStart(2, "0")}-${String(
          unit
        ).padStart(2, "0")}`;
        const builtUp = sizes[(unit - 1) % sizes.length];
        const facings = ["North", "South", "East", "West", "Pool View", "KLCC View"];
        const positions = ["Corner", "Intermediate", "End"];
        lots.push({
          id,
          block,
          level,
          type: builtUp >= 1250 ? "Duplex" : "Apartment",
          builtUp,
          shareUnits: Math.round(builtUp / 10),
          bumi: rand() < 0.4 ? "Bumi" : "Non-Bumi",
          address: `Unit ${id}, Residensi Rumahku, Jalan Ampang Hilir, 55000 Kuala Lumpur`,
          subPhase: `Phase ${block === "A" ? 1 : 2}`,
          levelDesc: level === 1 ? "Podium" : `Level ${level}`,
          model: builtUp >= 1250 ? "Type C (Dual Key)" : builtUp >= 1100 ? "Type B" : "Type A",
          landArea: 0, // strata unit
          strataNum: `PT${45200 + unit}-${block}${level}`,
          facing: facings[(level * 4 + unit) % facings.length],
          position: positions[(unit - 1) % positions.length],
          remarks: "",
        });
      }
    }
  }

  // ---- owners: 20 owners over 24 lots (4 vacant) ----------------------
  const salutes = ["Mr", "Ms", "Mrs", "Encik", "Puan", "Dr", "Dato'"];
  const ethnics = ["Malay", "Chinese", "Indian", "Others"];
  const religions = ["Islam", "Buddhism", "Hinduism", "Christianity", "Others"];
  const maritals = ["Single", "Married", "Divorced"];
  const mailMethods: Owner["mailMethod"][] = ["Email", "Post", "SMS"];
  const owners: Owner[] = OWNER_NAMES.map(([name, nric], i) => {
    const lot = lots[i];
    const first = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
    // derive DOB (approx) from the NRIC prefix YYMMDD
    const yy = Number(nric.slice(0, 2));
    const year = (yy > 30 ? 1900 : 2000) + yy;
    const dob = `${year}-${nric.slice(2, 4)}-${nric.slice(4, 6)}`;
    const sex: Owner["sex"] = Number(nric.slice(-1)) % 2 === 0 ? "Female" : "Male";
    const salute = /binti|puan|ms|mrs/i.test(name)
      ? sex === "Female"
        ? "Puan"
        : "Ms"
      : name.includes("Dato'")
        ? "Dato'"
        : salutes[i % salutes.length];
    return {
      id: `OWN-${String(i + 1).padStart(3, "0")}`,
      name,
      nric,
      email: `${first}${i + 1}@gmail.com`,
      phone: `01${Math.floor(rand() * 2) + 2}-${String(
        Math.floor(rand() * 9000000) + 1000000
      )}`,
      lotIds: [lot.id],
      since: `20${18 + (i % 6)}-0${(i % 9) + 1}-15`,
      isCompany: false,
      address: lot.address,
      status: "Active",
      contactCode: `C${String(1001 + i)}`,
      dob,
      salute,
      sex,
      ethnic: ethnics[i % ethnics.length],
      religion: religions[i % religions.length],
      marital: maritals[i % maritals.length],
      nationality: "Malaysian",
      bumi: lot.bumi,
      mailMethod: mailMethods[i % mailMethods.length],
      companyNum: "",
      gstRegNo: "",
      designation: "",
      phone2: "",
      phone3: "",
      fax: "",
    };
  });

  // ---- billing codes --------------------------------------------------
  type BaseCode = Omit<
    BillingCode,
    | "dueDays"
    | "lpiChargeable"
    | "lpiRate"
    | "lpiGrace"
    | "lpiSkip"
    | "lpiMin"
    | "taxable"
    | "sstCode"
  >;
  const codes: BillingCode[] = ([
    {
      code: "IVSC",
      docType: "IV",
      description: "SERVICE CHARGE",
      method: "rate",
      rate: 0.25,
      frequency: "Monthly",
      debitAcc: "1201001",
      creditAcc: "4100001",
      active: true,
    },
    {
      code: "IVSF",
      docType: "IV",
      description: "SINKING FUND",
      method: "rate",
      rate: 0.025,
      frequency: "Monthly",
      debitAcc: "1201001",
      creditAcc: "4100002",
      active: true,
    },
    {
      code: "UBWM",
      docType: "UB",
      description: "WATER METER BILLING",
      method: "fixed",
      rate: 2.28, // RM per m³ (tariff)
      frequency: "Monthly",
      debitAcc: "1201001",
      creditAcc: "4100008",
      active: true,
    },
    {
      code: "IVWC",
      docType: "IV",
      description: "WHEEL CLAMPING",
      method: "fixed",
      rate: 50,
      frequency: "One-off",
      debitAcc: "1201001",
      creditAcc: "4110005",
      active: true,
    },
    {
      code: "IVAC",
      docType: "IV",
      description: "ACCESS CARD",
      method: "fixed",
      rate: 30,
      frequency: "One-off",
      debitAcc: "1201001",
      creditAcc: "4110001",
      active: true,
    },
    {
      code: "IVCP",
      docType: "IV",
      description: "CAR PARK RENTAL",
      method: "fixed",
      rate: 80,
      frequency: "Monthly",
      debitAcc: "1201001",
      creditAcc: "4110003",
      active: true,
    },
    {
      code: "IA",
      docType: "IA",
      description: "LATE PAYMENT INTEREST",
      method: "fixed",
      rate: 0,
      frequency: "One-off",
      debitAcc: "1201001",
      creditAcc: "4120001",
      active: true,
    },
    {
      code: "DNRNV",
      docType: "DN",
      description: "RENOVATION DEPOSIT BILLING",
      method: "fixed",
      rate: 500,
      frequency: "One-off",
      debitAcc: "1201001",
      creditAcc: "2103001",
      active: true,
    },
    {
      code: "CNDRNV",
      docType: "CN",
      description: "RENOVATION DEPOSIT REFUND CREDIT",
      method: "fixed",
      rate: 500,
      frequency: "One-off",
      debitAcc: "2103001",
      creditAcc: "1201001",
      active: true,
    },
  ] as BaseCode[]).map((c): BillingCode => {
    // per-code LPI + tax defaults (CSS "Late payment charges setting")
    const chargeable = ["IVSC", "IVSF", "UBWM", "IVCP"].includes(c.code);
    return {
      ...c,
      dueDays: 14,
      lpiChargeable: chargeable,
      lpiRate: chargeable ? 10 : 0,
      lpiGrace: 14,
      lpiSkip: 0,
      lpiMin: 0,
      // car-park rental is a commercial supply → SST applies; the rest exempt
      taxable: c.code === "IVCP",
      sstCode: c.code === "IVCP" ? "SR" : "EX",
      postConsolidated: ["IVSC", "IVSF"].includes(c.code),
      offset: c.docType !== "CN",
    };
  });

  // ---- invoices Feb–Jul 2026 + receipts -------------------------------
  const invoices: Invoice[] = [];
  const receipts: Receipt[] = [];
  let ivSeq = 1;
  let orSeq = 1;
  let ubSeq = 1;

  const sc = codes[0];
  const sf = codes[1];

  const ownedLots = owners.map((o) => ({ owner: o, lot: lots.find((l) => l.id === o.lotIds[0])! }));

  for (const { owner, lot } of ownedLots) {
    // how many months this owner has paid (Feb=0 .. Jul=5)
    const r = rand();
    const paidThrough = r < 0.15 ? 2 : r < 0.35 ? 4 : r < 0.85 ? 6 : 5; // months paid out of 6
    for (let m = 1; m <= 6; m++) {
      // Feb (idx 1) .. Jul (idx 6)
      const date = monthStartISO(2026, m);
      const due = addDays(date, 14);
      const scAmt = Math.round(lot.builtUp * sc.rate * 100) / 100;
      const sfAmt = Math.round(lot.builtUp * sf.rate * 100) / 100;
      const ivNum = `IV-${String(10000000 + ivSeq++).slice(1)}`;
      const paid = m <= paidThrough;
      invoices.push({
        id: `${ivNum}-1`,
        docNum: ivNum,
        lotId: lot.id,
        date,
        dueDate: due,
        code: sc.code,
        docType: "IV",
        description: sc.description,
        amount: scAmt,
        balance: paid ? 0 : scAmt,
        periodStart: date,
        periodEnd: monthEndISO(2026, m),
      });
      invoices.push({
        id: `${ivNum}-2`,
        docNum: ivNum,
        lotId: lot.id,
        date,
        dueDate: due,
        code: sf.code,
        docType: "IV",
        description: sf.description,
        amount: sfAmt,
        balance: paid ? 0 : sfAmt,
        periodStart: date,
        periodEnd: monthEndISO(2026, m),
      });
      if (paid) {
        const payDate = addDays(date, 3 + Math.floor(rand() * 10));
        const orNum = `OR-${String(10000000 + orSeq++).slice(1)}`;
        receipts.push({
          id: orNum,
          docNum: orNum,
          lotId: lot.id,
          date: payDate,
          mode: rand() < 0.7 ? "Online Banking" : rand() < 0.5 ? "JomPAY" : "Cheque",
          refNum: String(Math.floor(rand() * 90000000) + 10000000),
          amount: Math.round((scAmt + sfAmt) * 100) / 100,
          allocations: [
            { invoiceId: `${ivNum}-1`, amount: scAmt },
            { invoiceId: `${ivNum}-2`, amount: sfAmt },
          ],
          remarks: `BEING PAYMENT FOR ${sc.code}-${ivNum}(RM${scAmt.toFixed(
            2
          )}) ${sf.code}-${ivNum}(RM${sfAmt.toFixed(2)})`,
        });
      }
    }
  }

  // a few water bills (UB) for first 8 owned lots — May & Jun readings
  const meters: Meter[] = lots.map((l, i) => ({
    lotId: l.id,
    meterNo: `WM${String(88000 + i)}`,
    lastDate: null,
    lastReading: 0,
  }));

  const tariff = codes[2].rate;
  for (let i = 0; i < 8; i++) {
    const lot = ownedLots[i].lot;
    const meter = meters.find((m) => m.lotId === lot.id)!;
    let reading = Math.floor(rand() * 40) + 20;
    for (const m of [4, 5]) {
      // May, Jun
      const use = Math.floor(rand() * 14) + 6;
      const prev = reading;
      reading += use;
      const date = `2026-0${m + 2}-15`;
      const ubNum = `UB-${String(10000000 + ubSeq++).slice(1)}`;
      const amt = Math.round(use * tariff * 100) / 100;
      const paid = i < 4 && m === 4;
      invoices.push({
        id: `${ubNum}-1`,
        docNum: ubNum,
        lotId: lot.id,
        date,
        dueDate: addDays(date, 14),
        code: "UBWM",
        docType: "UB",
        description: `WATER METER ${prev} → ${reading} (${use} m³)`,
        amount: amt,
        balance: paid ? 0 : amt,
        periodStart: addDays(date, -30),
        periodEnd: date,
      });
      if (paid) {
        const orNum = `OR-${String(10000000 + orSeq++).slice(1)}`;
        receipts.push({
          id: orNum,
          docNum: orNum,
          lotId: lot.id,
          date: addDays(date, 5),
          mode: "Online Banking",
          refNum: String(Math.floor(rand() * 90000000) + 10000000),
          amount: amt,
          allocations: [{ invoiceId: `${ubNum}-1`, amount: amt }],
          remarks: `BEING PAYMENT FOR UBWM-${ubNum}(RM${amt.toFixed(2)})`,
        });
      }
      meter.lastDate = date;
      meter.lastReading = reading;
      meter.lastConsume = use;
    }
  }

  // ---- deposits: renovation deposits with different lifecycles ---------
  const vouchers: Voucher[] = [];
  let dnSeq = 1;
  let pvSeq = 1;
  const depositCases: { idx: number; paid: boolean; refunded: boolean }[] = [
    { idx: 11, paid: true, refunded: true }, // Dato' Ong — refunded
    { idx: 0, paid: true, refunded: false }, // held
    { idx: 4, paid: false, refunded: false }, // billed, unpaid
  ];
  for (const c of depositCases) {
    const { lot } = ownedLots[c.idx];
    const dnNum = `DN-${String(10000000 + dnSeq++).slice(1)}`;
    const amt = 500;
    invoices.push({
      id: `${dnNum}-1`,
      docNum: dnNum,
      lotId: lot.id,
      date: "2026-06-05",
      dueDate: "2026-06-19",
      code: "DNRNV",
      docType: "DN",
      description: "RENOVATION DEPOSIT BILLING",
      amount: amt,
      balance: c.paid ? 0 : amt,
    });
    if (c.paid) {
      const orNum = `OR-${String(10000000 + orSeq++).slice(1)}`;
      receipts.push({
        id: orNum,
        docNum: orNum,
        lotId: lot.id,
        date: "2026-06-10",
        mode: "Online Banking",
        refNum: String(Math.floor(rand() * 90000000) + 10000000),
        amount: amt,
        allocations: [{ invoiceId: `${dnNum}-1`, amount: amt }],
        remarks: `BEING PAYMENT FOR DNRNV-${dnNum}(RM${amt.toFixed(2)})`,
      });
    }
    if (c.refunded) {
      const pvNum = `PV-${String(10000000 + pvSeq++).slice(1)}`;
      vouchers.push({
        id: pvNum,
        docNum: pvNum,
        lotId: lot.id,
        date: "2026-07-12",
        amount: amt,
        mode: "Online Banking",
        refNum: String(Math.floor(rand() * 90000000) + 10000000),
        description: "RENOVATION DEPOSIT REFUND",
        invoiceId: `${dnNum}-1`,
      });
    }
  }

  // ---- announcements ---------------------------------------------------
  const announcements: Announcement[] = [
    {
      id: "ANN-001",
      code: "LTR-001",
      title: "Notice of Annual General Meeting 2026",
      refText: "AGM 2026 / Notice 14 days",
      body: "Dear All Residents,\n\nNotice is hereby given that the Annual General Meeting of Residensi Rumahku will be held at the Community Hall, Level G on Saturday 15 August 2026 at 10.00 am.\n\nAgenda: adoption of audited accounts, election of committee members, appointment of auditor, and any other matters.\n\nManagement Office",
      date: "2026-07-10",
      audience: "Owners",
      published: true,
    },
    {
      id: "ANN-002",
      code: "LTR-002",
      title: "Scheduled Water Supply Disruption",
      refText: "Air Selangor maintenance",
      body: "Dear All Residents,\n\nPlease be informed that there will be a scheduled water supply disruption on Tuesday 22 July 2026, 9.00 am – 5.00 pm, for reservoir cleaning works by Air Selangor.\n\nKindly store sufficient water beforehand. We apologise for any inconvenience.\n\nManagement Office",
      date: "2026-07-15",
      audience: "All Residents",
      published: true,
    },
    {
      id: "ANN-003",
      code: "LTR-003",
      title: "Reminder: No Pets Policy",
      refText: "House Rules Clause 12",
      body: "Dear All Residents,\n\nWe would like to remind all residents that pets are not permitted in the building common areas as per House Rules Clause 12. Kindly ensure compliance to keep our community comfortable for everyone.\n\nManagement Office",
      date: "2026-06-28",
      audience: "All Residents",
      published: true,
    },
    {
      id: "ANN-004",
      code: "LTR-004",
      title: "Gotong-Royong & Recycling Drive",
      refText: "Community event draft",
      body: "Dear All Residents,\n\nJoin us for a community gotong-royong and recycling drive on Sunday 3 August 2026 from 8.00 am at the main lobby. Refreshments provided!\n\nManagement Office",
      date: "2026-07-18",
      audience: "All Residents",
      published: false,
    },
  ];

  // ---- parcels ---------------------------------------------------------
  const couriers = ["J&T Express", "Shopee Xpress", "Pos Laju", "GDex", "Ninja Van"];
  const parcels: Parcel[] = [];
  const parcelLots = [0, 1, 3, 5, 7, 9, 11, 13];
  for (let i = 0; i < parcelLots.length; i++) {
    const { owner, lot } = ownedLots[parcelLots[i]];
    const collected = i % 3 === 0;
    const day = 14 + (i % 5);
    parcels.push({
      id: `PCL-${String(i + 1).padStart(4, "0")}`,
      lotId: lot.id,
      recipient: owner.name,
      courier: couriers[i % couriers.length],
      trackingNo: `MY${String(Math.floor(rand() * 9e9) + 1e9)}`,
      receivedAt: `2026-07-${String(day).padStart(2, "0")}T${10 + (i % 8)}:${i % 2 === 0 ? "15" : "40"}`,
      status: collected ? "Collected" : "At guardhouse",
      collectedAt: collected
        ? `2026-07-${String(day).padStart(2, "0")}T19:05`
        : undefined,
      collectedBy: collected ? owner.name.split(" ")[0] : undefined,
    });
  }

  // ---- parking bays ----------------------------------------------------
  const bays: ParkingBay[] = [];
  const plates = () =>
    `${["W", "V", "B", "K"][Math.floor(rand() * 4)]}${String.fromCharCode(65 + Math.floor(rand() * 26))}${String.fromCharCode(65 + Math.floor(rand() * 26))} ${Math.floor(rand() * 9000) + 1000}`;
  let bayNo = 1;
  for (const level of ["B1", "B2"]) {
    for (let i = 1; i <= 16; i++) {
      const id = `${level}-${String(i).padStart(2, "0")}`;
      const type =
        level === "B1" && i > 14 ? "OKU" : level === "B2" && i > 12 ? "Visitor" : "Resident";
      const assignIdx = bayNo - 1;
      const assigned = type === "Resident" && assignIdx < ownedLots.length;
      bays.push({
        id,
        level,
        type,
        assignedLotId: assigned ? ownedLots[assignIdx].lot.id : null,
        plate: assigned ? plates() : "",
        sticker: assigned ? `STK-${String(2600 + bayNo)}` : "",
        monthly: assigned && rand() < 0.25 ? 80 : 0,
      });
      bayNo++;
    }
  }

  return {
    lots,
    owners,
    codes,
    invoices,
    receipts,
    meters,
    vouchers,
    announcements,
    parcels,
    bays,
    settings: {
      propertyName: "Residensi Rumahku",
      propertyCode: "RMK",
      address:
        "Management Office, Residensi Rumahku, Jalan Ampang Hilir, 55000 Kuala Lumpur",
      phone: "03-9200 4096",
      email: "admin@rumahku.my",
      waterTariff: 2.28,
      lpiRatePct: 10,
      lpiGraceDays: 14,
      dueDays: 14,
      sstRatePct: 8,
      sstRegNo: "W10-2026-31000123",
    },
    seq: { IV: ivSeq, UB: ubSeq, IA: 1, DN: dnSeq, CN: 1, OR: orSeq, PV: pvSeq },
  };
}
