/** GST state codes (the first two digits of a GSTIN), used for place of supply and IGST vs CGST + SGST. */
export const STATES: [string, string][] = [
  ["01", "Jammu and Kashmir"],
  ["02", "Himachal Pradesh"],
  ["03", "Punjab"],
  ["04", "Chandigarh"],
  ["05", "Uttarakhand"],
  ["06", "Haryana"],
  ["07", "Delhi"],
  ["08", "Rajasthan"],
  ["09", "Uttar Pradesh"],
  ["10", "Bihar"],
  ["11", "Sikkim"],
  ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"],
  ["14", "Manipur"],
  ["15", "Mizoram"],
  ["16", "Tripura"],
  ["17", "Meghalaya"],
  ["18", "Assam"],
  ["19", "West Bengal"],
  ["20", "Jharkhand"],
  ["21", "Odisha"],
  ["22", "Chhattisgarh"],
  ["23", "Madhya Pradesh"],
  ["24", "Gujarat"],
  ["26", "Dadra and Nagar Haveli and Daman and Diu"],
  ["27", "Maharashtra"],
  ["29", "Karnataka"],
  ["30", "Goa"],
  ["31", "Lakshadweep"],
  ["32", "Kerala"],
  ["33", "Tamil Nadu"],
  ["34", "Puducherry"],
  ["35", "Andaman and Nicobar Islands"],
  ["36", "Telangana"],
  ["37", "Andhra Pradesh"],
  ["38", "Ladakh"],
  ["97", "Other Territory"],
];

export const stateName = (code: string) =>
  STATES.find(([c]) => c === code)?.[1] ?? "";

/** "10-Bihar", as the GST portal writes place of supply. */
export const placeOfSupply = (code: string) =>
  code ? `${code}-${stateName(code)}` : "";

/** The state code inside a GSTIN ("" if it doesn't look like one). */
export const gstinState = (gstin: string) =>
  /^\d{2}/.test(gstin) && stateName(gstin.slice(0, 2)) ? gstin.slice(0, 2) : "";

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** The discount % on MRP that sells a pack at an agreed rate (never above MRP). Bill screen and back end use the same sum. */
export function discForRate(rate: number, mrp: number): number {
  if (!(mrp > 0) || rate >= mrp) return 0;
  return Math.min(100, Math.max(0, r2((1 - rate / mrp) * 100)));
}

/** One line of the shop's GST rate table: a rate for every HSN code that starts with `hsn` (the longest match wins). */
export interface GstRate {
  hsn: string;
  rate: number;
  note: string;
}

/** Starting rates (after the GST Council's changes of 22 Sep 2025). The shop can edit or import its own table in Settings when
 * the Government changes a rate; always confirm a rate against the CBIC notification or with your CA. */
export const DEFAULT_GST_RATES: GstRate[] = [
  { hsn: "3002", rate: 5, note: "Vaccines, antisera, blood products" },
  { hsn: "3003", rate: 5, note: "Medicaments (not in measured doses)" },
  { hsn: "3004", rate: 5, note: "Medicines in measured doses or retail packs" },
  { hsn: "3005", rate: 5, note: "Bandages, dressings, cotton wool" },
  {
    hsn: "3006",
    rate: 5,
    note: "Pharmaceutical goods: sutures, first-aid boxes",
  },
  { hsn: "9018", rate: 5, note: "Medical instruments and devices" },
  { hsn: "9019", rate: 5, note: "Mechano-therapy and oxygen apparatus" },
  { hsn: "9021", rate: 5, note: "Orthopaedic appliances, hearing aids" },
  { hsn: "2106", rate: 18, note: "Food supplements and preparations" },
  { hsn: "3304", rate: 18, note: "Beauty and skin-care products" },
  { hsn: "3808", rate: 18, note: "Disinfectants, antiseptic liquids" },
];

/** The rate for an HSN code from a rate table, or null when no line matches. */
export function rateForHsn(table: GstRate[], hsn: string): number | null {
  const code = hsn.replace(/\D/g, "");
  if (!code) return null;
  let best: GstRate | null = null;
  for (const r of table)
    if (code.startsWith(r.hsn) && (!best || r.hsn.length > best.hsn.length))
      best = r;
  return best ? best.rate : null;
}
