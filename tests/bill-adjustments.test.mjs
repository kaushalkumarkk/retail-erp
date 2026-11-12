import test from "node:test";
import assert from "node:assert/strict";
import { fresh, saveItem, saveParty, calculate, postDocument, voidDocument, balance, ledger, metrics, round, validateBackup } from "../src/lib/engine.mjs";

function fixture() {
  let db = fresh();
  for (const [name, gst] of [["Rice", 5], ["Tea", 18]])
    db = saveItem(db, { name, cost: 50, price: 100, stock: 10, min: 0, gst, unit: "PCS", hsn: name });
  db = saveParty(db, { name: "Customer", type: "Customer", state: "09", opening: 0, creditLimit: 0 });
  db = saveParty(db, { name: "Supplier", type: "Supplier", state: "10", opening: 0 });
  return db;
}
const lines = (db) => db.items.map((item) => ({ itemId: item.id, qty: 1, rate: 100, discount: 0 }));
const entry = (db, overrides = {}) => ({ type: "sale", partyId: db.parties[0].id, gst: true, date: "2026-11-12", mode: "Cash", paid: 0, lines: lines(db), billDiscount: 20, loadingCharge: 10, ...overrides });
function balanced(db) {
  for (const journal of db.journals)
    assert.equal(round(journal.entries.reduce((s, e) => s + e.debit - e.credit, 0)), 0);
}

test("loading and bill discount adjust mixed GST values, payments, reports and reversible journals", () => {
  const initial = fixture();
  const { db, doc } = postDocument(initial, entry(initial, { paid: 50 }));
  assert.equal(doc.subtotal, 200);
  assert.equal(doc.taxable, 190);
  assert.equal(doc.tax, 21.85);
  assert.equal(doc.total, 211.85);
  assert.deepEqual(doc.lines.map((l) => [l.itemTaxable, l.billDiscount, l.loadingCharge, l.taxable]), [[100, 10, 5, 95], [100, 10, 5, 95]]);
  assert.equal(balance(db, db.parties[0]), 161.85);
  assert.equal(metrics(db).revenue, 190);
  assert.equal(metrics(db).output, 21.85);
  balanced(db);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(db))), db);
  const cancelled = voidDocument(db, doc.id);
  assert.equal(balance(cancelled, cancelled.parties[0]), 0);
  assert.deepEqual(cancelled.items.map((i) => i.stock), initial.items.map((i) => i.stock));
  const originalBalances = new Map(ledger(initial).map((a) => [a.account, round(a.debit - a.credit)]));
  for (const a of ledger(cancelled))
    assert.equal(round(a.debit - a.credit), originalBalances.get(a.account) || 0);
  balanced(cancelled);
});

test("non-GST invoices apply item discount, bill discount and loading in order", () => {
  const db = fixture();
  const input = [{ itemId: db.items[0].id, qty: 2, rate: 100, discount: 10 }];
  const calc = calculate(input, db.items, false, false, { billDiscount: 20, loadingCharge: 30 });
  assert.equal(calc.subtotal, 180);
  assert.equal(calc.taxable, 190);
  assert.equal(calc.total, 190);
  assert.equal(calc.tax, 0);
  assert.equal(calculate(input, db.items, false).total, 180);
});

test("paise allocations preserve exact totals including full discounts and zero-value lines", () => {
  const db = fixture();
  const input = [0, 0.01, 0.02, 0.04].map((rate) => ({ itemId: db.items[0].id, qty: 1, rate }));
  const calc = calculate(input, db.items, false, false, { billDiscount: 0.07, loadingCharge: 0.01 });
  assert.equal(calc.total, 0.01);
  assert.equal(round(calc.lines.reduce((sum, l) => sum + l.billDiscount, 0)), 0.07);
  assert.equal(round(calc.lines.reduce((sum, l) => sum + l.loadingCharge, 0)), 0.01);
  assert.ok(calc.lines.every((l) => l.taxable >= 0));
});

test("invalid adjustments and overpayments are rejected without changing the workspace", () => {
  const db = fixture(), before = structuredClone(db);
  for (const field of ["billDiscount", "loadingCharge"])
    for (const value of [-1, Infinity, NaN, "invalid"])
      assert.throws(() => postDocument(db, entry(db, { [field]: value })), /Bill discount|Loading charge/);
  assert.throws(() => postDocument(db, entry(db, { billDiscount: 201 })), /cannot exceed/);
  assert.throws(() => postDocument(db, entry(db, { paid: 220 })), /Paid amount/);
  assert.throws(() => calculate([{ itemId: db.items[0].id, qty: 1, rate: 0 }], db.items, false, false, { loadingCharge: 1 }), /positive value/);
  assert.deepEqual(db, before);
  const { db: saved } = postDocument(db, entry(db));
  saved.documents[0].loadingCharge = -1;
  assert.throws(() => validateBackup(saved), /loadingCharge/);
});

test("adjusted purchases capitalize the net item cost and reverse cleanly", () => {
  const initial = fixture();
  const { db, doc } = postDocument(initial, entry(initial, { type: "purchase", partyId: initial.parties[1].id }));
  assert.equal(doc.igst, 21.85);
  assert.equal(doc.cgst, 0);
  assert.equal(doc.sgst, 0);
  assert.equal(db.items[0].cost, 54.09);
  assert.equal(balance(db, db.parties[1]), 211.85);
  balanced(db);
  const cancelled = voidDocument(db, doc.id);
  assert.equal(cancelled.items[0].cost, 50);
  assert.equal(balance(cancelled, cancelled.parties[1]), 0);
  balanced(cancelled);
});
