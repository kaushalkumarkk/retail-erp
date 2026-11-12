const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { verifyLicence, indiaDate } = require("./licence-core.cjs");

function assertProviderDirectory(directory, publicKey) {
  if (!directory) throw Error("Connect your provider register to open Superadmin.");
  try {
    const privateKey = crypto.createPrivateKey(fs.readFileSync(path.join(directory, "private-key.pem")));
    const expectedKey = publicKey?.type === "public" ? publicKey : crypto.createPublicKey(publicKey);
    const expected = expectedKey.export({ type: "spki", format: "der" });
    const actual = crypto.createPublicKey(privateKey).export({ type: "spki", format: "der" });
    if (!actual.equals(expected)) throw Error("Key mismatch");
  } catch {
    throw Error("Superadmin requires the provider folder with this app's matching signing key.");
  }
  return directory;
}

function readProviderRegistry({ directory, publicKey, localKeys = [], machine, now = Date.now() }) {
  assertProviderDirectory(directory, publicKey);
  let records;
  try {
    records = JSON.parse(fs.readFileSync(path.join(directory, "licences.json"), "utf8"));
    if (!Array.isArray(records)) throw Error("Invalid registry");
  } catch {
    throw Error("The provider licence register is missing or damaged.");
  }
  const localIds = new Set(localKeys.map((key) => verifyLicence(key, publicKey, machine).id));
  const date = indiaDate(now);
  const seen = new Set();
  const rows = records.map((record) => {
    const p = verifyLicence(record.key, publicKey);
    if (seen.has(p.id)) throw Error("The provider register contains duplicate licence numbers.");
    seen.add(p.id);
    const daysRemaining = Math.max(0, Math.ceil((Date.parse(p.expires + "T00:00:00+05:30") - now) / 86400000));
    const validity = p.starts > date ? "Scheduled" : p.expires <= date ? "Expired" : daysRemaining <= 30 ? "Expiring soon" : "Valid";
    return {
      id: p.id, shop: p.shop, machine: p.machine,
      date: p.issued, starts: p.starts, expires: p.expires,
      validity, daysRemaining,
      activation: localIds.has(p.id) ? "Activated locally" : "Unconfirmed (offline)",
      renewalOf: typeof record.renewalOf === "string" ? record.renewalOf.slice(0, 80) : "",
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.shop.localeCompare(b.shop));
  return { rows, checkedAt: new Date(now).toISOString() };
}

module.exports = { assertProviderDirectory, readProviderRegistry };
