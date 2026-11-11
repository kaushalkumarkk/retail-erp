import test from "node:test";
import assert from "node:assert/strict";
import {
  fresh,
  saveItem,
  saveParty,
  postDocument,
  postPayment,
  postExpense,
  voidDocument,
  calculate,
  balance,
  metrics,
  ledger,
  importItems,
  parseCSV,
  validateBackup,
  financialYear,
} from "../src/lib/engine.mjs";
function fixture() {
  let db = saveItem(fresh(), {
    name: "Rice",
    cost: 50,
    price: 70,
    stock: 20,
    min: 2,
    gst: 5,
    unit: "KG",
    hsn: "1006",
    barcode: "RICE1",
  });
  db = saveParty(db, {
    name: "Customer",
    type: "Customer",
    state: "09",
    opening: 0,
    creditLimit: 0,
  });
  db = saveParty(db, {
    name: "Supplier",
    type: "Supplier",
    state: "10",
    opening: 0,
  });
  return db;
}
function invoice(db, overrides = {}) {
  return {
    type: "sale",
    gst: true,
    partyId: db.parties[0].id,
    lines: [{ itemId: db.items[0].id, qty: 2, rate: 70, discount: 0 }],
    paid: 0,
    mode: "Cash",
    date: "2026-11-11",
    ...overrides,
  };
}
function balanced(db) {
  for (const j of db.journals)
    assert.ok(
      Math.abs(j.entries.reduce((s, e) => s + e.debit - e.credit, 0)) < 0.02,
    );
  const rows = ledger(db);
  assert.ok(Math.abs(rows.reduce((s, a) => s + a.debit - a.credit, 0)) < 0.02);
}
test("sale reduces stock, computes CGST/SGST and COGS, keeps balanced books", () => {
  const initial = fixture();
  const { db, doc } = postDocument(initial, invoice(initial));
  assert.equal(db.items[0].stock, 18);
  assert.equal(initial.items[0].stock, 20);
  assert.equal(doc.total, 147);
  assert.equal(doc.cgst, 3.5);
  assert.equal(doc.sgst, 3.5);
  assert.equal(doc.igst, 0);
  assert.equal(balance(db, db.parties[0]), 147);
  assert.equal(metrics(db).profit, 40);
  assert.equal(metrics(db).stock, 900);
  balanced(db);
});
test("purchase updates weighted cost and IGST; supplier payment reduces outstanding", () => {
  let db = fixture();
  const result = postDocument(
    db,
    invoice(db, {
      type: "purchase",
      partyId: db.parties[1].id,
      lines: [{ itemId: db.items[0].id, qty: 10, rate: 80, discount: 0 }],
      paid: 40,
    }),
  );
  db = result.db;
  assert.equal(db.items[0].stock, 30);
  assert.equal(db.items[0].cost, 60);
  assert.equal(result.doc.igst, 40);
  assert.equal(result.doc.cgst, 0);
  assert.equal(balance(db, db.parties[1]), 800);
  db = postPayment(db, {
    partyId: db.parties[1].id,
    amount: 300,
    mode: "Bank",
  });
  assert.equal(balance(db, db.parties[1]), 500);
  balanced(db);
});
test("rejects overselling including duplicate item lines and invalid numeric values", () => {
  const db = fixture();
  assert.throws(
    () =>
      postDocument(
        db,
        invoice(db, {
          lines: [
            { itemId: db.items[0].id, qty: 11, rate: 70 },
            { itemId: db.items[0].id, qty: 11, rate: 70 },
          ],
        }),
      ),
    /Insufficient/,
  );
  assert.throws(
    () => calculate([{ itemId: db.items[0].id, qty: -1, rate: 70 }], db.items),
    /Quantity/,
  );
  assert.throws(
    () => calculate([{ itemId: db.items[0].id, qty: 1, rate: NaN }], db.items),
    /Rate/,
  );
  assert.throws(
    () =>
      calculate(
        [{ itemId: db.items[0].id, qty: 1, rate: 70, discount: 101 }],
        db.items,
      ),
    /Discount/,
  );
});
test("credit limits, walk-in credit and overpayment are blocked", () => {
  let db = fixture();
  db.parties[0].creditLimit = 100;
  assert.throws(() => postDocument(db, invoice(db)), /credit limit/);
  assert.throws(
    () => postDocument(db, invoice(db, { partyId: "" })),
    /customer/,
  );
  assert.throws(() => postDocument(db, invoice(db, { paid: 200 })), /Paid/);
  assert.throws(
    () =>
      postPayment(db, { partyId: db.parties[0].id, amount: 10, mode: "Cash" }),
    /exceeds/,
  );
});
test("non-GST invoices compute zero tax; payment and expense update cash and P&L", () => {
  let db = fixture();
  db = postDocument(db, invoice(db, { gst: false })).db;
  db = postPayment(db, {
    partyId: db.parties[0].id,
    amount: 140,
    mode: "Cash",
  });
  db = postExpense(db, {
    title: "Power",
    category: "Electricity",
    amount: 10,
    gst: 18,
    mode: "Cash",
  });
  assert.equal(balance(db, db.parties[0]), 0);
  assert.equal(metrics(db).cash, 128.2);
  assert.equal(metrics(db).profit, 30);
  assert.equal(metrics(db).input, 1.8);
  balanced(db);
});
test("cancellation reverses sale stock and accounting once", () => {
  let db = fixture();
  const result = postDocument(db, invoice(db, { paid: 147 }));
  db = voidDocument(result.db, result.doc.id);
  assert.equal(db.items[0].stock, 20);
  assert.equal(metrics(db).profit, 0);
  assert.equal(metrics(db).cash, 0);
  assert.equal(db.documents[0].void, true);
  assert.throws(() => voidDocument(db, result.doc.id), /already/);
  balanced(db);
});
test("cancelling invoice with a later payment is blocked", () => {
  let db = fixture();
  const result = postDocument(db, invoice(db));
  db = postPayment(result.db, {
    partyId: db.parties[0].id,
    amount: 147,
    mode: "Cash",
  });
  assert.throws(() => voidDocument(db, result.doc.id), /payments/);
});
test("purchase cancellation restores prior inventory cost; later stock activity blocks cancellation", () => {
  let db = fixture();
  const p = postDocument(
    db,
    invoice(db, {
      type: "purchase",
      partyId: db.parties[1].id,
      lines: [{ itemId: db.items[0].id, qty: 10, rate: 80 }],
      paid: 840,
    }),
  );
  db = voidDocument(p.db, p.doc.id);
  assert.equal(db.items[0].stock, 20);
  assert.equal(db.items[0].cost, 50);
  balanced(db);
  let next = postDocument(p.db, invoice(p.db));
  next.db.documents[1].createdAt = new Date(
    Date.parse(p.doc.createdAt) + 1000,
  ).toISOString();
  assert.throws(() => voidDocument(next.db, p.doc.id), /later stock/);
});
test("CSV import supports quotes, rejects duplicate barcodes, and fails atomically", () => {
  const data =
    'name,cost,price,stock,gst,barcode\r\n"Rice, premium",50,70,20,5,ONE\r\n"A ""special"" item",5,8,1,0,TWO';
  const db = importItems(fresh(), data);
  assert.equal(db.items.length, 2);
  assert.equal(db.items[0].name, "Rice, premium");
  assert.equal(db.items[1].name, 'A "special" item');
  balanced(db);
  assert.throws(
    () => importItems(db, "name,cost,barcode\nDuplicate,1,ONE"),
    /Barcode/,
  );
  assert.throws(
    () => importItems(fresh(), "name,stock\nRice,2\nSugar,nope"),
    /invalid stock/,
  );
  assert.throws(() => parseCSV('name,cost\n"broken,5'), /unclosed/);
});
test("backup validates version, numbers, and balanced journals", () => {
  const db = fixture();
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(db))), db);
  assert.throws(() => validateBackup({ ...db, version: 999 }), /version/);
  const malformed = structuredClone(db);
  malformed.journals[0].entries[0].debit += 1;
  assert.throws(() => validateBackup(malformed), /unbalanced/);
  const invalid = structuredClone(db);
  invalid.items[0].stock = -1;
  assert.throws(() => validateBackup(invalid), /stock/);
});
test("opening balances post to equity, stock adjustments reconcile to inventory", () => {
  let db = fixture();
  db = saveParty(db, { ...db.parties[0], opening: 100 });
  db = saveParty(db, { ...db.parties[1], opening: 200 });
  assert.equal(balance(db, db.parties[0]), 100);
  assert.equal(balance(db, db.parties[1]), 200);
  db = saveItem(db, { ...db.items[0], stock: 25 });
  assert.equal(metrics(db).stock, 1250);
  assert.equal(ledger(db).find((a) => a.account === "Inventory").debit, 1250);
  balanced(db);
});
test("fiscal year starts in April", () => {
  assert.equal(financialYear("2027-03-31"), "2026-27");
  assert.equal(financialYear("2027-04-01"), "2027-28");
});
test("payments allocate opening debt first, then oldest invoices, and reversal restores balances", async () => {
  const { documentPaid, voidPayment } = await import("../src/lib/engine.mjs");
  let db = fixture();
  db = saveParty(db, { ...db.parties[0], opening: 100 });
  const first = postDocument(db, invoice(db));
  const second = postDocument(
    first.db,
    invoice(first.db, { date: "2026-11-12" }),
  );
  db = postPayment(second.db, {
    partyId: db.parties[0].id,
    amount: 247,
    mode: "Cash",
  });
  assert.equal(db.payments[0].allocations[0].documentId, "opening");
  assert.equal(documentPaid(db, first.doc), 147);
  assert.equal(documentPaid(db, second.doc), 0);
  assert.equal(balance(db, db.parties[0]), 147);
  db = voidPayment(db, db.payments[0].id);
  assert.equal(documentPaid(db, first.doc), 0);
  assert.equal(balance(db, db.parties[0]), 394);
  balanced(db);
  assert.throws(() => voidPayment(db, db.payments[0].id), /already/);
});
