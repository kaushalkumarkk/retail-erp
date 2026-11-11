import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  fresh,
  metrics,
  ledger,
  validateBackup,
  postDocument,
  saveParty,
} from "../src/lib/engine.mjs";
import { applyProductCatalog } from "../src/lib/catalog.mjs";
const payload = JSON.parse(
  fs.readFileSync(new URL("../src/data/rahul-products.json", import.meta.url)),
);
test("all supplied products, units, rates, HSN, SKU, metadata and signed stock import exactly once", () => {
  const db = applyProductCatalog(fresh(), payload);
  assert.equal(db.items.length, 109);
  assert.equal(metrics(db).stock, 3880770);
  assert.equal(db.items.filter((i) => i.stock < 0).length, 21);
  for (const p of payload.products) {
    const i = db.items.find((i) => i.id === p.id);
    assert.equal(i.name, p.name.trim());
    assert.equal(i.stock, p.currentStock);
    assert.equal(i.cost, p.purchasePrice);
    assert.equal(i.price, p.salePrice);
    assert.equal(i.gst, p.gstRate);
    assert.equal(i.unit, p.unit?.shortName || "PCS");
    assert.equal(i.hsn, p.hsnCode || "");
    assert.equal(i.sku, p.sku || "");
    assert.deepEqual(i.sourceProduct, p);
  }
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(db))), db);
  const a = ledger(db).find((a) => a.account === "Inventory");
  assert.equal(a.debit - a.credit, 3880770);
  db.items[0].stock -= 1;
  assert.equal(applyProductCatalog(db, payload), db);
  assert.equal(db.items.length, 109);
});
test("existing products and transactions are preserved during add-only catalog migration", () => {
  const db = fresh();
  db.items.push({
    id: "existing",
    name: payload.products[0].name,
    stock: 4,
    cost: 5,
  });
  const migrated = applyProductCatalog(db, payload);
  assert.equal(migrated.items.length, 109);
  assert.equal(migrated.items[0].stock, 4);
  assert.equal(db.items.length, 1);
});
test("purchase replenishing negative imported stock to zero remains finite and balanced", () => {
  let db = applyProductCatalog(fresh(), payload);
  db = saveParty(db, {
    name: "Supplier",
    type: "Supplier",
    state: "09",
    opening: 0,
  });
  const item = db.items.find((i) => i.stock === -2);
  const { db: next } = postDocument(db, {
    type: "purchase",
    partyId: db.parties[0].id,
    gst: true,
    paid: 0,
    mode: "Cash",
    lines: [{ itemId: item.id, qty: 2, rate: 50 }],
  });
  assert.equal(next.items.find((i) => i.id === item.id).stock, 0);
  assert.ok(Number.isFinite(next.items.find((i) => i.id === item.id).cost));
  for (const j of next.journals)
    assert.ok(
      Math.abs(j.entries.reduce((s, e) => s + e.debit - e.credit, 0)) < 0.02,
    );
});
