import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import core from "../electron/licence-core.cjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = process.env.RETAIL_ERP_VENDOR_DIR || path.join(root, ".vendor");
const privatePath = path.join(dir, "private-key.pem"),
  registryPath = path.join(dir, "licences.json"),
  publicPath = path.join(root, "electron", "licence-public.pem");
const [command, ...args] = process.argv.slice(2),
  arg = (name) => {
    const i = args.indexOf("--" + name);
    return i < 0 ? undefined : args[i + 1];
  };
const read = () =>
  fs.existsSync(registryPath)
    ? JSON.parse(fs.readFileSync(registryPath, "utf8"))
    : [];
try {
  if (command === "init") {
    if (fs.existsSync(privatePath) || fs.existsSync(publicPath))
      throw Error("Signing keys already exist. They will not be overwritten.");
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    fs.writeFileSync(
      privatePath,
      privateKey.export({ type: "pkcs8", format: "pem" }),
      { mode: 0o600 },
    );
    fs.writeFileSync(
      publicPath,
      publicKey.export({ type: "spki", format: "pem" }),
    );
    console.log(
      "Signing keys initialized. Private key stays in " +
        dir +
        "; back it up privately. Only the public key is packaged.",
    );
  } else if (command === "machine") console.log(core.machineId());
  else if (command === "list") {
    console.table(
      read().map(({ id, shop, machine, starts, expires, renewalOf }) => ({
        id,
        shop,
        machine,
        starts,
        expires,
        renewalOf,
      })),
    );
  } else if (command === "issue" || command === "renew") {
    const records = read();
    if (!Array.isArray(records)) throw Error("Licence registry is damaged.");
    const prior =
      command === "renew" ? records.find((r) => r.id === arg("id")) : null;
    if (command === "renew" && !prior)
      throw Error("Use renew --id with a licence number from list.");
    const shop = prior?.shop || arg("shop")?.trim(),
      machine = (prior?.machine || arg("machine") || "").toUpperCase();
    if (!shop || shop.length > 160) throw Error('Provide --shop "Shop name".');
    if (!/^[A-F0-9]{4}(?:-[A-F0-9]{4}){5}$/.test(machine))
      throw Error(
        "Provide --machine with the ID shown in the shop’s licence screen.",
      );
    if (prior && records.some((r) => r.renewalOf === prior.id))
      throw Error(
        "This licence has already been renewed. Renew the latest licence number shown by list.",
      );
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privatePath));
    const publicKey = fs.readFileSync(publicPath, "utf8");
    if (
      crypto
        .createPublicKey(privateKey)
        .export({ type: "spki", format: "pem" })
        .toString() !== publicKey
    )
      throw Error("The private key does not match this app’s public key.");
    const issued = core.indiaDate(),
      starts = prior && prior.expires > issued ? prior.expires : issued;
    const payload = {
      v: 1,
      app: "retail-erp",
      id:
        "RT-" +
        issued.slice(0, 4) +
        "-" +
        crypto.randomBytes(4).toString("hex").toUpperCase(),
      shop,
      machine,
      issued,
      starts,
      expires: core.addYear(starts),
    };
    const key = core.signLicence(payload, privateKey);
    core.verifyLicence(key, publicKey, machine);
    records.push({
      ...payload,
      key,
      renewalOf: prior?.id || "",
      createdAt: new Date().toISOString(),
    });
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(registryPath + ".tmp", JSON.stringify(records, null, 2), {
      mode: 0o600,
    });
    fs.renameSync(registryPath + ".tmp", registryPath);
    console.log(
      `${payload.id} · ${shop}\nStarts ${starts} · renewal due ${payload.expires}\nMachine ${machine}\n\n${key}`,
    );
  } else
    console.log(
      'Commands:\n  init\n  machine\n  issue --shop "Shop name" --machine MACHINE-ID\n  list\n  renew --id LICENCE-ID\nKeys are annual only. Early renewals start at the previous expiry; expired licences restart today.',
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
