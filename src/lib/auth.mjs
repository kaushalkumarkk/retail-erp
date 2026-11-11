const ITERATIONS = 310000;
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const bytes = (hex) =>
  new Uint8Array(hex.match(/../g).map((x) => parseInt(x, 16)));
export function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    !password.trim() ||
    password.length > 128
  )
    throw Error("Use a password with 8 to 128 characters.");
}
async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: bytes(salt), iterations },
      key,
      256,
    ),
  );
}
export async function hashPassword(password) {
  validatePassword(password);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return {
    algorithm: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt,
    hash: await derive(password, salt, ITERATIONS),
  };
}
export function validCredential(c) {
  return (
    c?.algorithm === "PBKDF2-SHA256" &&
    Number.isInteger(c.iterations) &&
    c.iterations >= 100000 &&
    c.iterations <= 1000000 &&
    /^[a-f0-9]{32}$/.test(c.salt) &&
    /^[a-f0-9]{64}$/.test(c.hash)
  );
}
export async function verifyPassword(password, credential) {
  if (
    !validCredential(credential) ||
    typeof password !== "string" ||
    password.length > 128
  )
    return false;
  const actual = await derive(password, credential.salt, credential.iterations);
  let diff = 0;
  for (let i = 0; i < actual.length; i++)
    diff |= actual.charCodeAt(i) ^ credential.hash.charCodeAt(i);
  return diff === 0;
}
export async function changePassword(db, userId, current, next) {
  const u = db.users.find((u) => u.id === userId);
  if (!u || !(await verifyPassword(current, u.credentials)))
    throw Error("Current password is incorrect.");
  const credentials = await hashPassword(next);
  return {
    ...db,
    users: db.users.map((u) => (u.id === userId ? { ...u, credentials } : u)),
  };
}
export function createRecoveryCode() {
  return (
    "RT-" +
    hex(crypto.getRandomValues(new Uint8Array(16)))
      .toUpperCase()
      .match(/.{4}/g)
      .join("-")
  );
}
export async function recoverPassword(db, userId, code, password) {
  const u = db.users.find((u) => u.id === userId);
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!u || !(await verifyPassword(normalized, u.recoveryCredentials)))
    throw Error("Recovery code is incorrect.");
  const credentials = await hashPassword(password),
    recoveryCode = createRecoveryCode(),
    recoveryCredentials = await hashPassword(recoveryCode);
  const user = { ...u, credentials, recoveryCredentials };
  return {
    db: { ...db, users: db.users.map((x) => (x.id === userId ? user : x)) },
    user,
    recoveryCode,
  };
}
