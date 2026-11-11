const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const PREFIX = "RETAIL1-";
function dateValid(d) {
  return (
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !isNaN(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d
  );
}
function indiaDate(ms = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}
function addYear(d) {
  if (!dateValid(d)) throw Error("Invalid licence date.");
  const y = Number(d.slice(0, 4)) + 1,
    m = Number(d.slice(5, 7)),
    day = Number(d.slice(8));
  return `${y}-${String(m).padStart(2, "0")}-${String(Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate())).padStart(2, "0")}`;
}
function machineId() {
  let raw = "";
  try {
    if (process.platform === "darwin")
      raw =
        execFileSync("ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"], {
          encoding: "utf8",
          timeout: 5000,
        }).match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)?.[1] || "";
    else if (process.platform === "win32")
      raw =
        execFileSync(
          "reg",
          [
            "query",
            "HKLM\\SOFTWARE\\Microsoft\\Cryptography",
            "/v",
            "MachineGuid",
          ],
          { encoding: "utf8", timeout: 5000, windowsHide: true },
        ).match(/MachineGuid\s+REG_SZ\s+(\S+)/)?.[1] || "";
    else raw = fs.readFileSync("/etc/machine-id", "utf8").trim();
  } catch {}
  raw ||= [
    os.platform(),
    os.hostname(),
    os.userInfo().username,
    os.cpus()[0]?.model,
  ].join("|");
  return crypto
    .createHash("sha256")
    .update("retail-erp-hw-v1|" + raw)
    .digest("hex")
    .slice(0, 24)
    .toUpperCase()
    .match(/.{4}/g)
    .join("-");
}
function signLicence(payload, privateKey) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return (
    PREFIX +
    encoded +
    "." +
    crypto.sign(null, Buffer.from(encoded), privateKey).toString("base64url")
  );
}
function verifyLicence(key, publicKey, machine) {
  if (typeof key !== "string" || key.length > 8192)
    throw Error("Invalid licence key.");
  const match = key
    .trim()
    .match(/^RETAIL1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!match) throw Error("Enter the complete RETAIL1- licence key.");
  if (
    !crypto.verify(
      null,
      Buffer.from(match[1]),
      publicKey,
      Buffer.from(match[2], "base64url"),
    )
  )
    throw Error("Licence signature is invalid.");
  let p;
  try {
    p = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
  } catch {
    throw Error("Licence data is damaged.");
  }
  if (
    p.v !== 1 ||
    p.app !== "retail-erp" ||
    typeof p.id !== "string" ||
    !p.id.trim() ||
    p.id.length > 80 ||
    typeof p.shop !== "string" ||
    !p.shop.trim() ||
    p.shop.length > 160 ||
    !/^[A-F0-9]{4}(?:-[A-F0-9]{4}){5}$/.test(p.machine) ||
    !dateValid(p.issued) ||
    !dateValid(p.starts) ||
    !dateValid(p.expires) ||
    p.issued > p.starts ||
    p.expires !== addYear(p.starts)
  )
    throw Error("This is not a valid annual Retail ERP licence.");
  if (machine && p.machine !== machine)
    throw Error(
      "This licence belongs to another computer. Send the Machine ID to your provider.",
    );
  return p;
}
function createLicenceService({
  directory,
  publicKey,
  machine = machineId(),
  now = () => Date.now(),
  monotonic = () => Number(process.hrtime.bigint() / 1000000n),
}) {
  const file = path.join(directory, "licence-state.json");
  let state = { version: 1, keys: [], maxSeen: 0 },
    damaged = false;
  try {
    if (fs.existsSync(file)) {
      state = JSON.parse(fs.readFileSync(file, "utf8"));
      if (
        state.version !== 1 ||
        !Array.isArray(state.keys) ||
        state.keys.length > 100 ||
        !Number.isFinite(state.maxSeen) ||
        state.maxSeen < 0
      )
        throw Error("Invalid licence state.");
      for (const key of state.keys) verifyLicence(key, publicKey, machine);
    }
  } catch {
    damaged = true;
  }
  const base = Math.max(now(), state.maxSeen || 0),
    mono = monotonic();
  function persist() {
    fs.mkdirSync(directory, { recursive: true });
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }
  function time() {
    const ms = Math.max(
      now(),
      base + Math.max(0, monotonic() - mono),
      state.maxSeen || 0,
    );
    if (
      ms - state.maxSeen >= 10000 ||
      indiaDate(ms) !== indiaDate(state.maxSeen)
    ) {
      state.maxSeen = ms;
      persist();
    }
    return ms;
  }
  function status() {
    const common = { machineId: machine, daysLeft: 0 };
    if (damaged)
      return {
        ...common,
        state: "error",
        message:
          "Licence records could not be verified. Contact your software provider; business data is preserved.",
      };
    try {
      const ms = time(),
        date = indiaDate(ms);
      const keys = state.keys.map((k) => verifyLicence(k, publicKey, machine));
      const active = keys
        .filter((k) => k.issued <= date && k.starts <= date && date < k.expires)
        .sort((a, b) => b.expires.localeCompare(a.expires))[0];
      if (active) {
        const next = keys
          .filter((k) => k.starts >= active.expires)
          .sort((a, b) => a.starts.localeCompare(b.starts))[0];
        const days = Math.ceil(
          (Date.parse(active.expires + "T00:00:00+05:30") - ms) / 86400000,
        );
        return {
          ...common,
          ...active,
          state: "active",
          daysLeft: days,
          nextLicence: next || null,
          message: `Licensed to ${active.shop}. Renew before ${active.expires}.`,
        };
      }
      const last = keys.sort((a, b) => b.expires.localeCompare(a.expires))[0];
      if (!last)
        return {
          ...common,
          state: "missing",
          message: "An annual licence is required to use Retail ERP.",
        };
      if (last.starts > date)
        return {
          ...common,
          ...last,
          state: "pending",
          message: `This licence starts on ${last.starts}.`,
        };
      return {
        ...common,
        ...last,
        state: "expired",
        message: `Your licence expired on ${last.expires}. Renew to continue. Business records are preserved.`,
      };
    } catch {
      return {
        ...common,
        state: "error",
        message:
          "Licence status cannot be verified. Contact your software provider.",
      };
    }
  }
  function activate(input) {
    if (damaged)
      throw Error(
        "Licence records are damaged. Contact your software provider.",
      );
    const key = String(input || "").replace(/\s/g, ""),
      p = verifyLicence(key, publicKey, machine),
      date = indiaDate(time());
    if (p.issued > date)
      throw Error(
        "This key was issued in the future. Check the computer date.",
      );
    if (p.expires <= date)
      throw Error(
        "This licence has already expired. Ask for an annual renewal.",
      );
    if (!state.keys.includes(key)) {
      if (
        state.keys.some((k) => verifyLicence(k, publicKey, machine).id === p.id)
      )
        throw Error(
          "Licence number is already registered with different details.",
        );
      if (state.keys.length >= 100)
        throw Error("Contact support to archive old licence records.");
      state.keys.push(key);
      state.maxSeen = Math.max(state.maxSeen, now());
      persist();
    }
    return status();
  }
  function assertActive() {
    const s = status();
    if (s.state !== "active") {
      const e = new Error(s.message);
      e.code = "LICENCE_LOCKED";
      throw e;
    }
    return true;
  }
  return { status, activate, assertActive, machineId: machine };
}
module.exports = {
  PREFIX,
  dateValid,
  indiaDate,
  addYear,
  machineId,
  signLicence,
  verifyLicence,
  createLicenceService,
};
