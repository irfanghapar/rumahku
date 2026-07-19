export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  // richer fields for the sign-in property picker
  location: string; // short locality, e.g. "Ampang Hilir, KL"
  tag: string; // scheme type, e.g. "Serviced apartments"
  units: number; // total units (for the picker + right panel)
  since: number; // year management started
  accent: string; // hex accent for the card thumbnail gradient
}

/** Demo properties selectable at sign-in. In a real backend each would
 *  scope its own data; in this prototype they share the sample dataset
 *  and drive the property identity shown on bills, receipts & statements. */
export const PROPERTIES: Property[] = [
  {
    id: "rmk",
    code: "RMK",
    name: "Residensi Rumahku",
    address:
      "Management Office, Residensi Rumahku, Jalan Ampang Hilir, 55000 Kuala Lumpur",
    phone: "03-9200 4096",
    email: "admin@rumahku.my",
    location: "Ampang Hilir, KL",
    tag: "Serviced apartments",
    units: 24,
    since: 2019,
    accent: "#9FE870",
  },
  {
    id: "vp",
    code: "VP",
    name: "Vista Perdana Condominium",
    address:
      "Management Office, Vista Perdana, Jalan Kiara 3, 50480 Kuala Lumpur",
    phone: "03-6201 8890",
    email: "admin@vistaperdana.my",
    location: "Mont Kiara, KL",
    tag: "Condominium · 2 towers",
    units: 96,
    since: 2016,
    accent: "#6AB0E8",
  },
  {
    id: "ms",
    code: "MS",
    name: "Menara Saujana Residences",
    address:
      "Management Office, Menara Saujana, Persiaran Surian, 47810 Petaling Jaya",
    phone: "03-7845 1220",
    email: "admin@saujana.my",
    location: "Kota Damansara, PJ",
    tag: "Mixed residential",
    units: 60,
    since: 2021,
    accent: "#E0A458",
  },
];

export function findProperty(id: string | undefined): Property {
  return PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0];
}
