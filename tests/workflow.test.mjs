import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  changePassword,
  validCredential,
} from "../src/lib/auth.mjs";
import {
  yearRange,
  validPeriod,
  periodPreset,
  scopeTransactions,
} from "../src/lib/period.mjs";
import {
  fresh,
  saveItem,
  postDocument,
  metrics,
  validateBackup,
} from "../src/lib/engine.mjs";
test("passwords are salted hashes, changes verify current password, and old passwords stop working", async () => {
  const first = await hashPassword("SecureTest!23"),
    second = await hashPassword("SecureTest!23");
  assert.ok(validCredential(first));
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(await verifyPassword("wrong", first), false);
  assert.equal(await verifyPassword("SecureTest!23", first), true);
  assert.equal(await verifyPassword("anything", { hash: "broken" }), false);
  let db = fresh();
  db.users[0].credentials = first;
  await assert.rejects(
    () => changePassword(db, "owner", "wrong", "AnotherTest!45"),
    /incorrect/,
  );
  const changed = await changePassword(
    db,
    "owner",
    "SecureTest!23",
    "AnotherTest!45",
  );
  assert.equal(
    await verifyPassword("SecureTest!23", changed.users[0].credentials),
    false,
  );
  assert.equal(
    await verifyPassword("AnotherTest!45", changed.users[0].credentials),
    true,
  );
  assert.equal(db.users[0].credentials.hash, first.hash);
  assert.deepEqual(
    validateBackup(JSON.parse(JSON.stringify(changed))),
    changed,
  );
  await assert.rejects(() => hashPassword("short"), /8 to 128/);
});
test("financial years and custom ranges validate and preserve current inventory while scoping transactions", () => {
  assert.deepEqual(yearRange("2025-26"), {
    year: "2025-26",
    from: "2025-04-01",
    to: "2026-03-31",
  });
  assert.equal(validPeriod({ ...yearRange(), from: "2026-02-30" }), false);
  assert.equal(
    validPeriod({ year: "all", from: "2026-11-12", to: "2026-11-01" }),
    false,
  );
  assert.equal(validPeriod({ year: "all", from: "", to: "" }), true);
  let db = saveItem(fresh(), {
    name: "Test",
    stock: 10,
    cost: 10,
    price: 20,
    gst: 0,
    min: 0,
  });
  for (const date of ["2025-05-10", "2026-05-10"])
    db = postDocument(db, {
      type: "sale",
      gst: false,
      date,
      paid: 20,
      partyId: "",
      mode: "Cash",
      lines: [{ itemId: db.items[0].id, qty: 1, rate: 20 }],
    }).db;
  const scoped = scopeTransactions(db, yearRange("2025-26"));
  assert.equal(scoped.documents.length, 1);
  assert.equal(metrics(scoped).revenue, 20);
  assert.equal(scoped.items[0].stock, 8);
  assert.equal(scopeTransactions(db, periodPreset("all")).documents.length, 2);
  assert.equal(db.documents.length, 2);
  assert.equal(validPeriod(periodPreset("month")), true);
});
test("recovery codes verify, rotate after reset, and never replace business data", async () => {
  const { createRecoveryCode, recoverPassword } =
    await import("../src/lib/auth.mjs");
  let db = fresh();
  const code = createRecoveryCode();
  assert.match(code, /^RT-(?:[A-F0-9]{4}-){7}[A-F0-9]{4}$/);
  db.users[0].credentials = await hashPassword("InitialTest!23");
  db.users[0].recoveryCredentials = await hashPassword(code);
  await assert.rejects(
    () => recoverPassword(db, "owner", "RT-INVALID", "RecoveredTest!45"),
    /incorrect/,
  );
  const recovered = await recoverPassword(
    db,
    "owner",
    code,
    "RecoveredTest!45",
  );
  assert.deepEqual(recovered.db.items, db.items);
  assert.notEqual(recovered.recoveryCode, code);
  assert.equal(
    await verifyPassword("RecoveredTest!45", recovered.user.credentials),
    true,
  );
  assert.equal(
    await verifyPassword("InitialTest!23", recovered.user.credentials),
    false,
  );
  await assert.rejects(
    () => recoverPassword(recovered.db, "owner", code, "AgainTest!67"),
    /incorrect/,
  );
  assert.deepEqual(
    validateBackup(JSON.parse(JSON.stringify(recovered.db))),
    recovered.db,
  );
});
