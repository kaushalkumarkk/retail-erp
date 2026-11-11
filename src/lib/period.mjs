import { today, financialYear } from "./engine.mjs";
export function yearRange(year = financialYear()) {
  if (!/^\d{4}-\d{2}$/.test(year))
    throw Error("Select a valid financial year.");
  const first = Number(year.slice(0, 4));
  if (year !== `${first}-${String(first + 1).slice(2)}`)
    throw Error("Invalid financial year.");
  return { year, from: `${first}-04-01`, to: `${first + 1}-03-31` };
}
export function validPeriod(p) {
  if (
    !p ||
    ![
      "all",
      ...Array.from(
        { length: 201 },
        (_, i) => `${2000 + i}-${String(2001 + i).slice(2)}`,
      ),
    ].includes(p.year)
  )
    return false;
  const date = (d) =>
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !isNaN(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d;
  if (
    (p.from && !date(p.from)) ||
    (p.to && !date(p.to)) ||
    (p.from && p.to && p.from > p.to)
  )
    return false;
  if (p.year !== "all") {
    const y = yearRange(p.year);
    return !!p.from && !!p.to && p.from >= y.from && p.to <= y.to;
  }
  return true;
}
export function periodPreset(name, year = financialYear()) {
  const now = today();
  if (name === "all") return { year: "all", from: "", to: "" };
  if (name === "today") return { year: financialYear(now), from: now, to: now };
  if (name === "month")
    return {
      year: financialYear(now),
      from: now.slice(0, 8) + "01",
      to: new Date(
        Date.UTC(Number(now.slice(0, 4)), Number(now.slice(5, 7)), 0),
      )
        .toISOString()
        .slice(0, 10),
    };
  return yearRange(year === "all" ? financialYear() : year);
}
export function inPeriod(date, p) {
  return (!p.from || date >= p.from) && (!p.to || date <= p.to);
}
export function scopeTransactions(db, p) {
  return {
    ...db,
    ...Object.fromEntries(
      ["documents", "payments", "expenses", "journals"].map((key) => [
        key,
        db[key].filter((d) => inPeriod(d.date, p)),
      ]),
    ),
  };
}
