// Print/invoice layout options saved in settings.print. Every value is optional;
// old workspaces without settings.print print exactly like before.
export const PAPER_SIZES = [
  ["A4", "A4 Standard Sheet"],
  ["A5", "A5 Half Sheet"],
  ["80mm", "80mm Thermal Receipt"],
  ["58mm", "58mm Compact Receipt"],
];
export const FONTS = [
  ["Arial, sans-serif", "Arial"],
  ["Verdana, sans-serif", "Verdana"],
  ["Tahoma, sans-serif", "Tahoma"],
  ["'Segoe UI', sans-serif", "Segoe UI"],
  ["Georgia, serif", "Georgia"],
  ["'Times New Roman', serif", "Times New Roman"],
  ["'Courier New', monospace", "Courier New"],
];
export const SHOW_OPTIONS = [
  ["gstin", "Shop GSTIN"],
  ["phone", "Shop phone"],
  ["partyAddress", "Customer address"],
  ["partyPhone", "Customer phone"],
  ["partyState", "Customer state"],
  ["partyGstin", "Customer GSTIN"],
  ["mode", "Payment mode"],
  ["status", "Paid / unpaid status"],
  ["reference", "Reference number"],
  ["serial", "Serial number column (#)"],
  ["hsn", "HSN and GST % under item name"],
  ["discount", "Item discount note"],
  ["unit", "Unit column"],
  ["rate", "Price / unit column"],
  ["taxBreakup", "CGST / SGST / IGST lines"],
  ["receivedDue", "Received, previous due and balance rows"],
  ["balances", "Total balance box"],
  ["amountWords", "Amount in words"],
  ["paymentDetails", "Bank and UPI details"],
  ["terms", "Terms and conditions"],
  ["signatures", "Signature lines"],
];
export const PRINT_DEFAULTS = {
  paper: "",
  accent: "#10758e",
  font: FONTS[0][0],
  fontSize: 12,
  margin: 10,
  logo: "",
  logoHeight: 60,
  logoAlign: "left",
  headerNote: "",
  footerNote: "",
  titles: { tax: "TAX INVOICE", plain: "INVOICE", purchase: "PURCHASE BILL" },
  labels: {
    billTo: "Bill To",
    supplier: "Supplier",
    number: "INVOICE NUMBER",
    date: "INVOICE DATE",
    mode: "PAYMENT MODE",
    status: "INVOICE STATUS",
    terms: "Terms and Conditions",
    customerSign: "Receiver's Signature",
    ownerSign: "Authorized Signatory",
  },
  show: Object.fromEntries(SHOW_OPTIONS.map(([key]) => [key, true])),
};
const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const text = (value, fallback, max = 120) =>
  typeof value === "string" && value.trim() ? value.slice(0, max) : fallback;
export function printOptions(settings = {}) {
  const raw = settings.print && typeof settings.print === "object" ? settings.print : {};
  const d = PRINT_DEFAULTS;
  const titles = { ...d.titles }, labels = { ...d.labels }, show = { ...d.show };
  for (const key of Object.keys(titles)) titles[key] = text(raw.titles?.[key], titles[key], 40);
  for (const key of Object.keys(labels)) labels[key] = text(raw.labels?.[key], labels[key], 60);
  for (const key of Object.keys(show)) if (typeof raw.show?.[key] === "boolean") show[key] = raw.show[key];
  const paper = PAPER_SIZES.some(([id]) => id === raw.paper) ? raw.paper : "";
  return {
    paper: paper || settings.printFormat || "A4",
    accent: /^#[0-9a-f]{6}$/i.test(raw.accent || "") ? raw.accent : d.accent,
    font: FONTS.some(([id]) => id === raw.font) ? raw.font : d.font,
    fontSize: clamp(raw.fontSize, 8, 18, d.fontSize),
    margin: clamp(raw.margin, 0, 30, d.margin),
    logo: typeof raw.logo === "string" && raw.logo.startsWith("data:image/") ? raw.logo : "",
    logoHeight: clamp(raw.logoHeight, 20, 160, d.logoHeight),
    logoAlign: ["left", "center", "right"].includes(raw.logoAlign) ? raw.logoAlign : d.logoAlign,
    headerNote: typeof raw.headerNote === "string" ? raw.headerNote.slice(0, 300) : "",
    footerNote: typeof raw.footerNote === "string" ? raw.footerNote.slice(0, 300) : "",
    titles,
    labels,
    show,
  };
}
