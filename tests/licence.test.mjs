import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import core from "../electron/licence-core.cjs";
const machine = "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF";
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "retail-licence-"));
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  let now = Date.parse("2026-11-11T12:00:00+05:30"),
    mono = 0;
  const options = {
    directory: dir,
    publicKey,
    machine,
    now: () => now,
    monotonic: () => mono,
  };
  const payload = {
    v: 1,
    app: "retail-erp",
    id: "RT-TEST-1",
    shop: "Test Shop",
    machine,
    issued: "2026-11-11",
    starts: "2026-11-11",
    expires: "2027-11-11",
  };
  return {
    dir,
    publicKey,
    privateKey,
    payload,
    options,
    service: core.createLicenceService(options),
    sign: (p) => core.signLicence(p, privateKey),
    setNow: (n) => (now = n),
    setMono: (n) => (mono = n),
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}
test("annual signed licence binds to one computer, expires at India midnight, and cannot be extended by clock rollback", () => {
  const f = fixture();
  try {
    assert.equal(f.service.status().state, "missing");
    assert.throws(() => f.service.assertActive(), /required/);
    f.service.activate(f.sign(f.payload));
    assert.equal(f.service.status().state, "active");
    assert.equal(f.service.assertActive(), true);
    f.setNow(Date.parse("2027-11-10T23:59:59+05:30"));
    assert.equal(f.service.status().state, "active");
    f.setNow(Date.parse("2027-11-11T00:00:00+05:30"));
    assert.equal(f.service.status().state, "expired");
    assert.throws(() => f.service.assertActive(), /expired/);
    f.setNow(Date.parse("2026-11-11T12:00:00+05:30"));
    assert.equal(f.service.status().state, "expired");
    assert.equal(
      core.createLicenceService(f.options).status().state,
      "expired",
    );
  } finally {
    f.cleanup();
  }
});
test("tampered, cross-app, wrong-machine, perpetual and non-annual keys are rejected without changing active licence", () => {
  const f = fixture();
  try {
    const key = f.sign(f.payload);
    f.service.activate(key);
    for (const p of [
      { ...f.payload, machine: "0000-1111-2222-3333-4444-5555" },
      { ...f.payload, app: "medical" },
      { ...f.payload, expires: null },
      { ...f.payload, expires: "2028-11-11" },
    ])
      assert.throws(() => f.service.activate(f.sign(p)));
    assert.throws(() => f.service.activate(key.slice(0, -3) + "BAD"));
    assert.equal(f.service.status().id, f.payload.id);
  } finally {
    f.cleanup();
  }
});
test("early renewal is queued without discarding the current year and unlocks at the next anniversary", () => {
  const f = fixture();
  try {
    f.service.activate(f.sign(f.payload));
    const renewal = {
      ...f.payload,
      id: "RT-TEST-2",
      starts: f.payload.expires,
      expires: core.addYear(f.payload.expires),
    };
    f.service.activate(f.sign(renewal));
    assert.equal(f.service.status().id, "RT-TEST-1");
    assert.equal(f.service.status().nextLicence.id, "RT-TEST-2");
    f.setNow(Date.parse(renewal.starts + "T00:00:00+05:30"));
    assert.equal(f.service.status().state, "active");
    assert.equal(f.service.status().id, "RT-TEST-2");
    f.setNow(Date.parse(renewal.expires + "T00:00:00+05:30"));
    assert.equal(f.service.status().state, "expired");
  } finally {
    f.cleanup();
  }
});
test("future-only keys stay locked, leap years clamp to February 28, and corrupted licence state fails closed", () => {
  const f = fixture();
  try {
    assert.equal(core.addYear("2028-02-29"), "2029-02-28");
    const p = { ...f.payload, starts: "2027-11-11", expires: "2028-11-11" };
    assert.equal(f.service.activate(f.sign(p)).state, "pending");
    assert.throws(() => f.service.assertActive(), /starts/);
    fs.writeFileSync(path.join(f.dir, "licence-state.json"), "broken");
    const s = core.createLicenceService(f.options);
    assert.equal(s.status().state, "error");
    assert.throws(() => s.activate(f.sign(f.payload)), /damaged/);
  } finally {
    f.cleanup();
  }
});
test("elapsed monotonic time advances the licence even while wall clock is held back", () => {
  const f = fixture();
  try {
    f.service.activate(f.sign(f.payload));
    f.setMono(366 * 86400000);
    assert.equal(f.service.status().state, "expired");
  } finally {
    f.cleanup();
  }
});
