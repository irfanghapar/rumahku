"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { SessionProvider, useSession } from "@/lib/session";
import { PROPERTIES, findProperty } from "@/lib/properties";
import LoginScreen from "@/components/LoginScreen";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { title: string; items: NavItem[] };

const ic = (d: React.ReactNode, size = 17) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

const ICONS = {
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1v-9.5Z" />
    </>
  ),
  lots: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.6" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h6" />
    </>
  ),
  codes: <path d="M4 5h16M4 12h16M4 19h10" />,
  rates: (
    <>
      <path d="M5 19 19 5" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </>
  ),
  owners: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5" />
      <path d="M15.5 8.5a3 3 0 1 0 0-5" />
      <path d="M17 14.6c2 .6 3.2 2.3 3.5 4.9" />
    </>
  ),
  billing: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
  general: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h14v18l-2.3-1.5L14.4 21l-2.4-1.5L9.6 21l-2.3-1.5L5 21z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  ledger: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 16V4M12 9h3M12 13h3" />
    </>
  ),
  overdue: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3 2" />
    </>
  ),
  settle: (
    <>
      <path d="M4 7h13l-3-3M20 17H7l3 3" />
    </>
  ),
  deposit: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="14.5" cy="12" r="2.8" />
      <path d="M7 9v6" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3.5 10.5v3a1.5 1.5 0 0 0 1.5 1.5h2l7 4.5V6L7 10.5H5a1.5 1.5 0 0 0-1.5 1.5Z" />
      <path d="M17.5 9.5a4 4 0 0 1 0 5" />
      <path d="M7.5 15.5 9 20" />
    </>
  ),
  parcel: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12l8-4.5M12 12 4 7.5M12 12v9M16 5.2 8 9.8" />
    </>
  ),
  car: (
    <>
      <path d="M5 13 6.5 8a2 2 0 0 1 1.9-1.5h7.2A2 2 0 0 1 17.5 8L19 13" />
      <path d="M4 13h16v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-9v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z" />
      <path d="M7 15.5h.01M17 15.5h.01" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
};

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: ic(ICONS.home) }],
  },
  {
    title: "Setup",
    items: [
      { href: "/setup/lots", label: "Lot Information", icon: ic(ICONS.lots) },
      { href: "/setup/billing-codes", label: "Billing Codes", icon: ic(ICONS.codes) },
      { href: "/setup/billing-rates", label: "Billing Rates", icon: ic(ICONS.rates) },
      { href: "/setup/settings", label: "Property Settings", icon: ic(ICONS.settings) },
    ],
  },
  {
    title: "Ownership",
    items: [{ href: "/owners", label: "Owners", icon: ic(ICONS.owners) }],
  },
  {
    title: "Billing",
    items: [
      { href: "/billing/monthly", label: "Monthly Billing", icon: ic(ICONS.billing) },
      { href: "/billing/utility", label: "Utility Billing", icon: ic(ICONS.water) },
      { href: "/billing/general", label: "General Billing", icon: ic(ICONS.general) },
    ],
  },
  {
    title: "Payments",
    items: [{ href: "/receipts", label: "Official Receipt", icon: ic(ICONS.receipt) }],
  },
  {
    title: "Accounts",
    items: [
      { href: "/accounts/ledger", label: "Account Ledger", icon: ic(ICONS.ledger) },
      { href: "/accounts/outstanding", label: "Outstanding", icon: ic(ICONS.overdue) },
      { href: "/accounts/settlement", label: "Billing & Settlement", icon: ic(ICONS.settle) },
      { href: "/accounts/deposits", label: "Deposit Statement", icon: ic(ICONS.deposit) },
      { href: "/accounts/reminders", label: "Reminders & Statements", icon: ic(ICONS.megaphone) },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/community/announcements", label: "Announcements", icon: ic(ICONS.megaphone) },
      { href: "/community/parcels", label: "Parcels", icon: ic(ICONS.parcel) },
      { href: "/community/parking", label: "Parking", icon: ic(ICONS.car) },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  const { state } = useStore();
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-500 text-lime-400 shadow-card">
        {ic(ICONS.home, 18)}
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-ink">Rumahku</p>
        <p className="text-[11px] text-soot/70">{state.settings.propertyName}</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((group) => (
        <div key={group.title} className="mt-3">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-soot/50">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={
                  "mb-0.5 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors " +
                  (active
                    ? "bg-clay-50 font-semibold text-clay-500"
                    : "text-soot hover:bg-cream hover:text-ink")
                }
              >
                <span className={active ? "text-clay-500" : "text-soot/50"}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-lime-400" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

function ResetButton({ compact }: { compact?: boolean }) {
  const { dispatch } = useStore();
  return (
    <button
      className={"btn-secondary " + (compact ? "!px-3 !py-1.5 text-xs" : "w-full")}
      onClick={() => {
        if (confirm("Reset all demo data back to the original seed?"))
          dispatch({ type: "reset" });
      }}
    >
      Reset demo data
    </button>
  );
}

/** switch active property: updates the session + the property identity
 *  shown on documents. */
function useSwitchProperty() {
  const { state, dispatch } = useStore();
  const { session, signIn } = useSession();
  return (propertyId: string) => {
    if (!session) return;
    const prop = findProperty(propertyId);
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
    signIn({ ...session, propertyId });
  };
}

function PropertySwitcher() {
  const { session } = useSession();
  const switchTo = useSwitchProperty();
  return (
    <select
      className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-ink focus:outline-none"
      value={session?.propertyId ?? PROPERTIES[0].id}
      onChange={(e) => switchTo(e.target.value)}
      aria-label="Switch property"
    >
      {PROPERTIES.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.code})
        </option>
      ))}
    </select>
  );
}

function AccountBar({ stacked }: { stacked?: boolean }) {
  const { session, signOut } = useSession();
  if (!session) return null;
  return (
    <div className={stacked ? "space-y-2" : "flex items-center gap-2"}>
      <p className="truncate text-[11px] text-soot/70">
        Signed in as <span className="font-semibold text-soot">{session.email}</span>
      </p>
      <button
        onClick={signOut}
        className={
          "btn-secondary !px-3 !py-1.5 text-xs " + (stacked ? "w-full" : "")
        }
      >
        Sign out
      </button>
    </div>
  );
}

/* Desktop fixed sidebar */
function Sidebar() {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-paper lg:flex">
      <div className="px-5 pb-4 pt-5">
        <Logo />
      </div>
      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks />
      </nav>
      <div className="space-y-2 border-t border-line px-5 py-3">
        <AccountBar stacked />
      </div>
    </aside>
  );
}

/* Mobile slide-over menu */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-paper shadow-raised">
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-2 text-soot hover:bg-cream"
          >
            {ic(ICONS.close, 18)}
          </button>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks onNavigate={onClose} />
        </nav>
        <div className="bottom-safe space-y-3 border-t border-line px-4 pt-3">
          <div>
            <p className="label">Property</p>
            <PropertySwitcher />
          </div>
          <ResetButton />
          <AccountBar stacked />
        </div>
      </div>
    </div>
  );
}

/* Mobile top header */
function MobileHeader({ onMenu }: { onMenu: () => void }) {
  const { state } = useStore();
  return (
    <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-cream/90 px-4 backdrop-blur lg:hidden">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="-ml-2 rounded-full p-2 text-ink hover:bg-paper"
      >
        {ic(ICONS.menu, 20)}
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-clay-500 text-lime-400">
          {ic(ICONS.home, 14)}
        </div>
        <span className="text-sm font-bold tracking-tight text-ink">Rumahku</span>
      </div>
      <span className="inline-flex items-center rounded-full bg-clay-500 px-2.5 py-1 text-[11px] font-bold text-lime-400">
        {state.settings.propertyCode}
      </span>
    </header>
  );
}

/* Desktop top bar */
function Topbar() {
  const { state } = useStore();
  return (
    <header className="no-print sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-line bg-cream/85 px-6 backdrop-blur lg:flex">
      <div className="flex items-center gap-2 text-xs text-soot/80">
        <span className="inline-flex h-2 w-2 rounded-full bg-lime-500" />
        Property Code:
        <span className="inline-flex items-center rounded-full bg-clay-500 px-2.5 py-0.5 text-[11px] font-bold text-lime-400">
          {state.settings.propertyCode}
        </span>
        <span className="mx-1 text-line">|</span>
        {state.settings.propertyName}
      </div>
      <div className="flex items-center gap-3">
        <PropertySwitcher />
        <ResetButton compact />
        <span className="h-5 w-px bg-line" />
        <AccountBar />
      </div>
    </header>
  );
}

/* Mobile bottom tab bar — mirrors the MyUnitManager mockup */
const TABS: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/", label: "Home", icon: ic(ICONS.home, 21) },
  { href: "/billing/monthly", label: "Billing", icon: ic(ICONS.billing, 21) },
  { href: "/receipts", label: "Receipt", icon: ic(ICONS.receipt, 21) },
  { href: "/accounts/outstanding", label: "Arrears", icon: ic(ICONS.overdue, 21) },
];

function BottomNav({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="no-print bottom-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper shadow-nav lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-2 py-1"
            >
              <span className={active ? "text-clay-500" : "text-soot/50"}>
                {t.icon}
              </span>
              <span
                className={
                  "text-[10px] " +
                  (active ? "font-bold text-clay-500" : "font-medium text-soot/60")
                }
              >
                {t.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={onMenu}
          className="flex min-w-[64px] flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-soot/50"
        >
          {ic(ICONS.menu, 21)}
          <span className="text-[10px] font-medium text-soot/60">Menu</span>
        </button>
      </div>
    </nav>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <Sidebar />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-60">
        <MobileHeader onMenu={() => setMenuOpen(true)} />
        <Topbar />
        <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
      </div>
      <BottomNav onMenu={() => setMenuOpen(true)} />
    </>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();
  if (!ready) return <div className="min-h-screen bg-cream" />;
  if (!session) return <LoginScreen />;
  return <Frame>{children}</Frame>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <SessionProvider>
        <AuthGate>{children}</AuthGate>
      </SessionProvider>
    </StoreProvider>
  );
}
