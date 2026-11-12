import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import core from "../electron/licence-core.cjs";
import provider from "../electron/provider-registry.cjs";
const machine = "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF";
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "retail-provider-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const pair = crypto.generateKeyPairSync("ed25519");
  fs.writeFileSync(path.join(directory, "private-key.pem"), pair.privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  const payload = { v: 1, app: "retail-erp", id: "RT-TEST", shop: "Test Shop", machine, issued: "2026-11-12", starts: "2026-11-12", expires: "2027-11-12" };
  const record = (values = {}) => {
    const p = { ...payload, ...values };
    return { ...p, key: core.signLicence(p, pair.privateKey) };
  };
  const write = (records) => fs.writeFileSync(path.join(directory, "licences.json"), JSON.stringify(records));
  write([record()]);
  const options = { directory, publicKey: pair.publicKey, machine, now: Date.parse("2026-11-12T12:00:00+05:30") };
  return { directory, pair, record, write, options };
}

test("provider register requires the matching private key on every read", (t) => {
  const f = fixture(t);
  assert.equal(provider.readProviderRegistry(f.options).rows.length, 1);
  fs.unlinkSync(path.join(f.directory, "private-key.pem"));
  assert.throws(() => provider.readProviderRegistry(f.options), /matching signing key/);
  const other = crypto.generateKeyPairSync("ed25519");
  fs.writeFileSync(path.join(f.directory, "private-key.pem"), other.privateKey.export({ type: "pkcs8", format: "pem" }));
  assert.throws(() => provider.readProviderRegistry(f.options), /matching signing key/);
  assert.throws(() => provider.assertProviderDirectory(null, f.pair.publicKey), /Connect your provider/);
});

test("validity and offline activation are independent; returned rows contain no licence or signing keys", (t) => {
  const f = fixture(t);
  const local = f.record();
  const remote = f.record({ id: "RT-REMOTE", shop: "Remote Shop", machine: "1111-2222-3333-4444-5555-6666" });
  const expired = f.record({ id: "RT-OLD", issued: "2025-11-12", starts: "2025-11-12", expires: "2026-11-12" });
  const soon = f.record({ id: "RT-SOON", issued: "2025-12-01", starts: "2025-12-01", expires: "2026-12-01" });
  const scheduled = { ...f.record({ id: "RT-NEXT", starts: "2027-11-12", expires: "2028-11-12" }), renewalOf: local.id };
  f.write([local, remote, expired, soon, scheduled]);
  const result = provider.readProviderRegistry({ ...f.options, localKeys: [local.key, scheduled.key] });
  const get = (id) => result.rows.find((r) => r.id === id);
  assert.equal(get(local.id).activation, "Activated locally");
  assert.equal(get(remote.id).activation, "Unconfirmed (offline)");
  assert.equal(get(remote.id).validity, "Valid");
  assert.equal(get(expired.id).validity, "Expired");
  assert.equal(get(soon.id).validity, "Expiring soon");
  assert.equal(get(scheduled.id).validity, "Scheduled");
  assert.equal(get(scheduled.id).activation, "Activated locally");
  assert.equal(get(scheduled.id).renewalOf, local.id);
  assert.equal(JSON.stringify(result).includes("RETAIL1-"), false);
  assert.equal(JSON.stringify(result).includes("PRIVATE KEY"), false);
  assert.equal(get(expired.id).daysRemaining, 0);
  const midnight = provider.readProviderRegistry({ ...f.options, now: Date.parse("2027-11-12T00:00:00+05:30") });
  assert.equal(midnight.rows.find((r) => r.id === local.id).validity, "Expired");
});

test("licence signatures and registry structure are checked instead of trusting metadata", (t) => {
  const f = fixture(t);
  f.write([{ ...f.record(), shop: "Forged display name", machine: "forged", expires: "2099-01-01" }]);
  const row = provider.readProviderRegistry(f.options).rows[0];
  assert.equal(row.shop, "Test Shop");
  assert.equal(row.machine, machine);
  assert.equal(row.expires, "2027-11-12");
  f.write([{ ...f.record(), key: "RETAIL1-broken.invalid" }]);
  assert.throws(() => provider.readProviderRegistry(f.options), /signature|complete/);
  f.write({ licences: [] });
  assert.throws(() => provider.readProviderRegistry(f.options), /damaged/);
  f.write([f.record(), f.record()]);
  assert.throws(() => provider.readProviderRegistry(f.options), /duplicate/);
});
