import { balance, documentPaid, round } from "./engine.mjs";

const small = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function words(n) {
  if (n < 20) return small[n];
  if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${small[n % 10]}` : ""}`;
  for (const [value, label] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"]]) {
    if (n >= value) return `${words(Math.floor(n / value))} ${label}${n % value ? ` ${words(n % value)}` : ""}`;
  }
}
export function amountInWords(amount) {
  const paise = Math.round(Math.abs(amount) * 100);
  return `${amount < 0 ? "Minus " : ""}${words(Math.floor(paise / 100))} Rupees${paise % 100 ? ` and ${words(paise % 100)} Paise` : ""} Only`;
}
export function invoiceSummary(db, doc) {
  const received = documentPaid(db, doc);
  const due = doc.void ? 0 : round(doc.total - received);
  const party = db.parties.find((p) => p.id === doc.partyId);
  const totalBalance = party ? balance(db, party) : due;
  return { received, due, previousDue: round(totalBalance - due), totalBalance,
    status: doc.void ? "CANCELLED" : due <= 0 ? "PAID" : received > 0 ? "PART PAID" : "UNPAID" };
}
