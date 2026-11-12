import test from "node:test";
import assert from "node:assert/strict";
import { addDays, dueInfo, fresh } from "../src/lib/engine.mjs";

const db = (extra = {}) => ({ ...fresh(), payments: [], ...extra });
const bill = (over = {}) => ({ id: "d1", type: "sale", total: 1000, paid: 0, date: "2026-01-01", void: false, ...over });

test("addDays crosses months and years", () => {
  assert.equal(addDays("2026-12-25", 10), "2027-01-04");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("unpaid bill is overdue after credit days, with days counted", () => {
  const info = dueInfo(db(), bill(), "2026-02-10");
  assert.equal(info.due, "2026-01-31");
  assert.equal(info.overdue, true);
  assert.equal(info.days, 10);
  assert.equal(info.open, 1000);
});

test("explicit due date, paid and cancelled bills", () => {
  assert.equal(dueInfo(db(), bill({ dueDate: "2026-03-01" }), "2026-02-10").overdue, false);
  assert.equal(dueInfo(db(), bill({ paid: 1000 }), "2026-06-01").overdue, false);
  assert.equal(dueInfo(db(), bill({ void: true }), "2026-06-01").overdue, false);
});

test("credit days come from settings", () => {
  const custom = db();
  custom.settings.creditDays = 7;
  assert.equal(dueInfo(custom, bill(), "2026-01-09").overdue, true);
  assert.equal(dueInfo(custom, bill(), "2026-01-08").overdue, false);
});

import { postDocument, postPayment, saveItem, saveParty, documentPaid, balance } from "../src/lib/engine.mjs";

function setup() {
  let state = fresh();
  state = saveItem(state, { name: "Rice", category: "x", unit: "PCS", cost: 50, price: 100, gst: 0, stock: 100, min: 0 });
  state = saveParty(state, { name: "Ram", type: "Customer", opening: 500, state: state.settings.state });
  const partyId = state.parties[0].id, itemId = state.items[0].id;
  const sale = (st, date) => postDocument(st, { type: "sale", gst: false, partyId, date, mode: "Credit", paid: 0, lines: [{ itemId, qty: 2, rate: 100, discount: 0 }] }).db;
  state = sale(state, "2026-01-01");
  state = sale(state, "2026-02-01");
  return { state, partyId };
}

test("payment can settle only a chosen bill and leave older dues alone", () => {
  const { state, partyId } = setup();
  const [oldBill, newBill] = state.documents;
  const next = postPayment(state, { partyId, amount: 200, mode: "Cash", applyTo: newBill.id });
  assert.equal(documentPaid(next, newBill), 200);
  assert.equal(documentPaid(next, oldBill), 0);
  assert.equal(balance(next, next.parties[0]), 500 + 400 - 200);
  assert.throws(() => postPayment(state, { partyId, amount: 250, mode: "Cash", applyTo: newBill.id }), /exceeds the balance/);
});

test("default payment still pays opening balance then oldest bill first", () => {
  const { state, partyId } = setup();
  const next = postPayment(state, { partyId, amount: 600, mode: "Cash" });
  const [oldBill, newBill] = next.documents;
  assert.equal(documentPaid(next, oldBill), 100);
  assert.equal(documentPaid(next, newBill), 0);
});

test("opening-only payment cannot exceed the opening balance", () => {
  const { state, partyId } = setup();
  const next = postPayment(state, { partyId, amount: 500, mode: "Cash", applyTo: "opening" });
  assert.equal(documentPaid(next, next.documents[0]), 0);
  assert.throws(() => postPayment(state, { partyId, amount: 501, mode: "Cash", applyTo: "opening" }), /opening balance/);
});
