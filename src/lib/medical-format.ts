export const rupees = (n: number | null | undefined) => {
  const v = n ?? 0;
  return `${v < 0 ? "-" : ""}₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const pad = (n: number) => String(n).padStart(2, "0");

export function today(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysAgo(n: number): string {
  return today(new Date(Date.now() - n * 86_400_000));
}

export function monthStart(): string {
  return today().slice(0, 8) + "01";
}

/** 2027-03 -> 03/27 (as printed on strips). */
export const expiryLabel = (e: string) =>
  e && e.length >= 7 ? `${e.slice(5, 7)}/${e.slice(2, 4)}` : e;

/** "2026-10-15 14:05:00" -> "15 Oct 2026, 2:05 pm" */
export function dateTime(s: string): string {
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime())
    ? s
    : d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function dateOnly(s: string): string {
  const d = new Date(s.slice(0, 10) + "T00:00:00");
  return isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/** Months until a YYYY-MM expiry (0 = this month, negative = expired). */
export function monthsLeft(expiry: string): number {
  const now = new Date();
  const [y, m] = expiry.split("-").map(Number);
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

/** Units as packs + loose, e.g. 25 units of a 10-strip -> "2 strips + 5". */
export function packsLabel(units: number, packSize: number, unit = ""): string {
  if (packSize <= 1) return `${units}${unit ? ` ${unit}` : ""}`;
  const packs = Math.floor(units / packSize);
  const loose = units % packSize;
  if (packs && loose) return `${packs} × ${packSize} + ${loose}`;
  if (packs) return `${packs} × ${packSize}`;
  return `${loose}${unit ? ` ${unit}` : ""}`;
}

/** "10 Tab" for a strip, or "Bottle · 100 ml" for a syrup. */
export const packDescription = (m: {
  pack_size: number;
  unit: string;
  content?: string;
}) =>
  `${m.pack_size > 1 ? `${m.pack_size} ${m.unit}` : m.unit}${m.content ? ` · ${m.content}` : ""}`;
