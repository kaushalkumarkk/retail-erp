import test from "node:test";
import assert from "node:assert/strict";
import { fresh, saveItem, saveParty, postDocument, postPayment, voidDocument } from "../src/lib/engine.mjs";
import { amountInWords, invoiceSummary } from "../src/lib/invoice-format.mjs";

test("invoice amounts use Indian currency words including paise and carry", () => {
  assert.equal(amountInWords(25010), "Twenty Five Thousand Ten Rupees Only");
  assert.equal(amountInWords(167893.25), "One Lakh Sixty Seven Thousand Eight Hundred Ninety Three Rupees and Twenty Five Paise Only");
  assert.equal(amountInWords(0), "Zero Rupees Only");
  assert.equal(amountInWords(99.999), "One Hundred Rupees Only");
  assert.equal(amountInWords(10000000), "One Crore Rupees Only");
});

test("invoice balance separates other dues, reflects later payments, and excludes cancelled bills", () => {
  let db = saveItem(fresh(), { name: "Rice", cost: 5, price: 20, stock: 100, min: 0, gst: 0, unit: "BAG" });
  db = saveParty(db, { name: "Customer", type: "Customer", state: "09", opening: 50, address: "Ghazipur", phone: "1234567890", creditLimit: 0 });
  const result = postDocument(db, { type: "sale", gst: false, partyId: db.parties[0].id, lines: [{ itemId: db.items[0].id, qty: 1, rate: 20 }], paid: 5, mode: "Cash", date: "2026-11-12" });
  db = result.db;
  const doc = result.doc;
  assert.equal(doc.partyAddress, "Ghazipur");
  assert.equal(doc.partyPhone, "1234567890");
  assert.deepEqual(invoiceSummary(db, doc), { received: 5, due: 15, previousDue: 50, totalBalance: 65, status: "PART PAID" });
  db = postPayment(db, { type: "in", partyId: doc.partyId, amount: 60, mode: "Cash", date: "2026-11-12" });
  assert.deepEqual(invoiceSummary(db, doc), { received: 15, due: 5, previousDue: 0, totalBalance: 5, status: "PART PAID" });
  const cancelled = voidDocument(result.db, doc.id);
  assert.deepEqual(invoiceSummary(cancelled, cancelled.documents[0]), { received: 5, due: 0, previousDue: 50, totalBalance: 50, status: "CANCELLED" });
});

test("walk-in receipts never include another customer's balance", () => {
  const db = fresh();
  const doc = { total: 20, paid: 20, id: "walk-in", void: false };
  assert.deepEqual(invoiceSummary(db, doc), { received: 20, due: 0, previousDue: 0, totalBalance: 0, status: "PAID" });
});
