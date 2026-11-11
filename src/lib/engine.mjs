import { validCredential } from "./auth.mjs";
export const VERSION = 1;
export const round = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const money = (n) =>
  `${n < 0 ? "-" : ""}₹${Math.abs(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const uid = () => globalThis.crypto.randomUUID();
export const financialYear = (date = today()) => {
  const [y, m] = date.split("-").map(Number);
  const a = m >= 4 ? y : y - 1;
  return `${a}-${String(a + 1).slice(2)}`;
};
export const fresh = () => ({
  version: VERSION,
  settings: {
    name: "RAHUL JEE TRADING COMPANY",
    owner: "Rahul",
    gstin: "09DMCPG4193P1ZG",
    state: "09",
    address: "",
    phone: "",
    email: "",
    pan: "",
    category: "Retail Store / Kirana",
    legalName: "",
    upi: "",
    bank: "",
    account: "",
    ifsc: "",
    branch: "",
    prefix: "INV",
    printFormat: "A4",
    terms: "Thank you for your business.",
    openingCash: 0,
  },
  items: [],
  parties: [],
  documents: [],
  payments: [],
  expenses: [],
  journals: [],
  users: [{ id: "owner", name: "Rahul", role: "Admin" }],
});
const finiteStock = (n) => {
  const value = Number(n);
  if (!Number.isFinite(value)) throw Error("Invalid stock quantity.");
  return value;
};
const positive = (n, label, zero = true) => {
  if (
    !Number.isFinite(Number(n)) ||
    Number(n) < 0 ||
    (!zero && Number(n) === 0)
  )
    throw Error(
      `${label} must be ${zero ? "zero or greater" : "greater than zero"}.`,
    );
  return Number(n);
};
export function calculate(lines, items, gst = true, interstate = false) {
  if (!lines.length) throw Error("Add at least one item.");
  const result = lines.map((l) => {
    const i = items.find((i) => i.id === l.itemId);
    if (!i) throw Error("An item no longer exists.");
    const qty = positive(l.qty, "Quantity", false),
      rate = positive(l.rate, "Rate"),
      discount = positive(l.discount || 0, "Discount");
    if (discount > 100) throw Error("Discount cannot exceed 100%.");
    const gstRate = gst ? positive(l.gstRate ?? i.gst, "GST") : 0;
    if (gstRate > 100) throw Error("GST cannot exceed 100%.");
    const taxable = round(qty * rate * (1 - discount / 100)),
      tax = round((taxable * gstRate) / 100);
    const cgst = interstate ? 0 : round(tax / 2),
      sgst = interstate ? 0 : round(tax - cgst);
    return {
      ...l,
      qty,
      rate,
      discount,
      name: i.name,
      hsn: i.hsn,
      unit: i.unit,
      cost: Number(i.cost),
      gstRate,
      taxable,
      tax,
      cgst,
      sgst,
      igst: interstate ? tax : 0,
      total: round(taxable + tax),
    };
  });
  const sum = (k) => round(result.reduce((s, l) => s + l[k], 0));
  return {
    lines: result,
    taxable: sum("taxable"),
    tax: sum("tax"),
    cgst: sum("cgst"),
    sgst: sum("sgst"),
    igst: sum("igst"),
    total: sum("total"),
  };
}
function journal(db, source, date, description, entries) {
  const clean = entries
    .filter((e) => e.debit || e.credit)
    .map((e) => ({
      ...e,
      debit: round(e.debit || 0),
      credit: round(e.credit || 0),
    }));
  if (Math.abs(clean.reduce((s, e) => s + e.debit - e.credit, 0)) > 0.02)
    throw Error("Journal is not balanced.");
  db.journals.push({ id: uid(), source, date, description, entries: clean });
}
export function saveItem(state, input) {
  const db = structuredClone(state);
  const old = db.items.find((i) => i.id === input.id);
  const item = {
    ...input,
    id: input.id || uid(),
    name: input.name.trim(),
    cost: positive(input.cost, "Purchase price"),
    price: positive(input.price, "Sale price"),
    stock: input.sourceProductId
      ? finiteStock(input.stock)
      : positive(input.stock, "Stock"),
    min: positive(input.min || 0, "Minimum stock"),
    gst: positive(input.gst || 0, "GST"),
    unit: input.unit || "PCS",
    date: old?.date || today(),
  };
  if (!item.name) throw Error("Enter the item name.");
  if (item.gst > 100) throw Error("GST must be between 0 and 100.");
  if (
    item.barcode &&
    db.items.some((i) => i.id !== item.id && i.barcode === item.barcode)
  )
    throw Error("Barcode already belongs to another item.");
  if (
    old &&
    db.documents.some((d) => d.lines.some((l) => l.itemId === old.id)) &&
    item.cost !== old.cost
  )
    throw Error(
      "Purchase price of a transacted item is maintained by purchase bills.",
    );
  const delta = round(
    item.stock * item.cost - (old ? old.stock * old.cost : 0),
  );
  if (delta)
    journal(
      db,
      item.id,
      today(),
      `Stock ${old ? "adjustment" : "opening"} · ${item.name}`,
      delta > 0
        ? [
            { account: "Inventory", debit: delta },
            { account: "Opening equity / stock adjustments", credit: delta },
          ]
        : [
            { account: "Opening equity / stock adjustments", debit: -delta },
            { account: "Inventory", credit: -delta },
          ],
    );
  db.items = old
    ? db.items.map((i) => (i.id === item.id ? item : i))
    : [...db.items, item];
  return db;
}
export function saveParty(state, input) {
  const db = structuredClone(state);
  const old = db.parties.find((p) => p.id === input.id);
  const p = {
    ...input,
    id: input.id || uid(),
    name: input.name.trim(),
    opening: positive(input.opening || 0, "Opening balance"),
    creditLimit: positive(input.creditLimit || 0, "Credit limit"),
    date: old?.date || today(),
  };
  if (!p.name) throw Error("Enter the party name.");
  if (
    p.gstin &&
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(p.gstin)
  )
    throw Error("Enter a valid 15-character GSTIN.");
  if (
    old &&
    db.documents.some((d) => d.partyId === p.id) &&
    old.type !== p.type
  )
    throw Error("Cannot change the type of a party with transactions.");
  const delta = round(p.opening - (old?.opening || 0));
  if (delta) {
    const a =
      p.type === "Customer" ? "Accounts receivable" : "Accounts payable";
    journal(
      db,
      p.id,
      today(),
      `Opening balance · ${p.name}`,
      delta > 0
        ? p.type === "Customer"
          ? [
              { account: a, debit: delta },
              { account: "Opening equity / stock adjustments", credit: delta },
            ]
          : [
              { account: "Opening equity / stock adjustments", debit: delta },
              { account: a, credit: delta },
            ]
        : p.type === "Customer"
          ? [
              { account: "Opening equity / stock adjustments", debit: -delta },
              { account: a, credit: -delta },
            ]
          : [
              { account: a, debit: -delta },
              { account: "Opening equity / stock adjustments", credit: -delta },
            ],
    );
  }
  db.parties = old
    ? db.parties.map((x) => (x.id === p.id ? p : x))
    : [...db.parties, p];
  return db;
}
export function balance(db, p) {
  const docs = db.documents.filter((d) => d.partyId === p.id && !d.void);
  return round(
    Number(p.opening || 0) +
      docs.reduce((s, d) => s + d.total - d.paid, 0) -
      db.payments
        .filter((x) => x.partyId === p.id && !x.void)
        .reduce((s, x) => s + x.amount, 0),
  );
}
export function documentPaid(db, doc) {
  return round(
    doc.paid +
      db.payments
        .filter((p) => !p.void)
        .reduce(
          (sum, p) =>
            sum +
            (p.allocations || [])
              .filter((a) => a.documentId === doc.id)
              .reduce((s, a) => s + a.amount, 0),
          0,
        ),
  );
}
export function postDocument(state, input) {
  const db = structuredClone(state);
  const purchase = input.type === "purchase",
    party = db.parties.find((p) => p.id === input.partyId);
  if (purchase && !party) throw Error("Select a supplier.");
  if (party && party.type !== (purchase ? "Supplier" : "Customer"))
    throw Error("Select the correct party type.");
  const interstate = (party?.state || db.settings.state) !== db.settings.state;
  const calc = calculate(
    input.lines,
    db.items,
    input.gst !== false,
    interstate,
  );
  const paid = positive(input.paid || 0, "Paid amount");
  if (paid > calc.total) throw Error("Paid amount cannot exceed the total.");
  if (!party && paid < calc.total)
    throw Error("Select a customer for a credit invoice.");
  if (
    party?.creditLimit > 0 &&
    !purchase &&
    balance(db, party) + calc.total - paid > party.creditLimit
  )
    throw Error("This invoice exceeds the customer credit limit.");
  const counts = {};
  for (const l of calc.lines)
    counts[l.itemId] = (counts[l.itemId] || 0) + l.qty;
  for (const [id, qty] of Object.entries(counts)) {
    const i = db.items.find((x) => x.id === id);
    if (!purchase && qty > i.stock)
      throw Error(`Insufficient stock for ${i.name}. Available: ${i.stock}`);
  }
  const sequence =
    db.documents.filter(
      (d) =>
        d.type === input.type &&
        d.gst === (input.gst !== false) &&
        financialYear(d.date) === financialYear(input.date || today()),
    ).length + 1;
  const doc = {
    ...input,
    ...calc,
    id: uid(),
    number: `${purchase ? "PUR" : input.gst === false ? "NG" : db.settings.prefix}/${financialYear(input.date || today())}/${String(sequence).padStart(4, "0")}`,
    date: input.date || today(),
    gst: input.gst !== false,
    paid,
    partyName: party?.name || "Walk-in Customer",
    partyGstin: party?.gstin || "",
    partyState: party?.state || db.settings.state,
    createdAt: new Date().toISOString(),
    void: false,
  };
  for (const [id, qty] of Object.entries(counts)) {
    const i = db.items.find((x) => x.id === id);
    if (purchase) {
      const added = calc.lines
        .filter((l) => l.itemId === id)
        .reduce((s, l) => s + l.taxable, 0);
      const oldValue = round(i.stock * i.cost);
      const nextStock = round(i.stock + qty);
      const nextCost =
        i.stock <= 0
          ? round(added / qty)
          : round((oldValue + added) / nextStock);
      if (i.stock < 0) {
        const adjustment = round(nextStock * nextCost - oldValue - added);
        if (adjustment)
          journal(
            db,
            doc.id,
            doc.date,
            `Deficit stock valuation · ${i.name}`,
            adjustment > 0
              ? [
                  { account: "Inventory", debit: adjustment },
                  {
                    account: "Opening equity / stock adjustments",
                    credit: adjustment,
                  },
                ]
              : [
                  {
                    account: "Opening equity / stock adjustments",
                    debit: -adjustment,
                  },
                  { account: "Inventory", credit: -adjustment },
                ],
          );
      }
      i.cost = nextCost;
      i.stock = round(i.stock + qty);
    } else i.stock = round(i.stock - qty);
  }
  db.documents.push(doc);
  const due = round(doc.total - paid),
    cash = input.mode === "Cash" ? "Cash" : "Bank",
    entries = purchase
      ? [
          { account: "Inventory", debit: calc.taxable },
          { account: "Input CGST", debit: calc.cgst },
          { account: "Input SGST", debit: calc.sgst },
          { account: "Input IGST", debit: calc.igst },
          { account: cash, credit: paid },
          { account: "Accounts payable", credit: due },
        ]
      : [
          { account: cash, debit: paid },
          { account: "Accounts receivable", debit: due },
          { account: "Sales", credit: calc.taxable },
          { account: "Output CGST", credit: calc.cgst },
          { account: "Output SGST", credit: calc.sgst },
          { account: "Output IGST", credit: calc.igst },
        ];
  if (!purchase) {
    const cogs = round(calc.lines.reduce((s, l) => s + l.cost * l.qty, 0));
    entries.push(
      { account: "Cost of goods sold", debit: cogs },
      { account: "Inventory", credit: cogs },
    );
  }
  journal(
    db,
    doc.id,
    doc.date,
    `${purchase ? "Purchase" : "Sale"} · ${doc.number}`,
    entries,
  );
  return { db, doc };
}
export function voidDocument(state, id) {
  const db = structuredClone(state),
    d = db.documents.find((d) => d.id === id);
  if (!d || d.void) throw Error("Document already cancelled.");
  if (
    db.payments.some(
      (p) =>
        !p.void &&
        (p.documentId === id ||
          p.allocations?.some((a) => a.documentId === id)),
    )
  )
    throw Error("Reverse linked payments before cancelling.");
  if (
    d.type === "purchase" &&
    db.documents.some(
      (x) =>
        !x.void &&
        x.id !== id &&
        new Date(x.createdAt) > new Date(d.createdAt) &&
        x.lines.some((l) => d.lines.some((a) => a.itemId === l.itemId)),
    )
  )
    throw Error("Cannot cancel a purchase after later stock transactions.");
  const party = db.parties.find((p) => p.id === d.partyId);
  if (party && round(balance(db, party) - (d.total - d.paid)) < 0)
    throw Error(
      "This invoice has later party payments. Reverse or reconcile those payments before cancelling.",
    );
  const counts = {};
  d.lines.forEach((l) => (counts[l.itemId] = (counts[l.itemId] || 0) + l.qty));
  for (const [id, q] of Object.entries(counts)) {
    const i = db.items.find((x) => x.id === id);
    if (d.type === "purchase" && i.stock < q)
      throw Error("Purchased stock has already been sold.");
    if (d.type === "purchase") {
      const value = d.lines
        .filter((l) => l.itemId === id)
        .reduce((s, l) => s + l.taxable, 0);
      i.cost =
        i.stock > q
          ? round((i.stock * i.cost - value) / (i.stock - q))
          : i.cost;
      i.stock = round(i.stock - q);
    } else i.stock = round(i.stock + q);
  }
  d.void = true;
  const original = {
    entries: db.journals
      .filter((j) => j.source === id)
      .flatMap((j) => j.entries),
  };
  journal(
    db,
    `void-${id}`,
    today(),
    `Cancellation · ${d.number}`,
    original.entries.map((e) => ({
      account: e.account,
      debit: e.credit,
      credit: e.debit,
    })),
  );
  return db;
}
export function postPayment(state, input) {
  const db = structuredClone(state),
    p = db.parties.find((p) => p.id === input.partyId);
  if (!p) throw Error("Select a party.");
  const amount = positive(input.amount, "Amount", false);
  if (amount > balance(db, p))
    throw Error("Payment exceeds the party outstanding balance.");
  const receipt = {
    ...input,
    id: uid(),
    number: `${p.type === "Customer" ? "RCPT" : "PAY"}-${String(db.payments.length + 1).padStart(4, "0")}`,
    amount,
    type: p.type === "Customer" ? "In" : "Out",
    date: input.date || today(),
    partyName: p.name,
    createdAt: new Date().toISOString(),
  };
  let remaining = amount;
  const priorOpeningPaid = db.payments
    .filter((x) => x.partyId === p.id && !x.void)
    .reduce(
      (sum, x) =>
        sum +
        (x.allocations || [])
          .filter((a) => a.documentId === "opening")
          .reduce((s, a) => s + a.amount, 0),
      0,
    );
  const opening = Math.min(
    remaining,
    Math.max(0, Number(p.opening || 0) - priorOpeningPaid),
  );
  const allocations = [];
  if (opening) {
    allocations.push({ documentId: "opening", amount: opening });
    remaining = round(remaining - opening);
  }
  for (const d of db.documents
    .filter((d) => d.partyId === p.id && !d.void)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    )) {
    const part = Math.min(remaining, round(d.total - documentPaid(db, d)));
    if (part > 0) {
      allocations.push({ documentId: d.id, amount: part });
      remaining = round(remaining - part);
    }
    if (remaining <= 0) break;
  }
  receipt.allocations = allocations;
  db.payments.push(receipt);
  const cash = input.mode === "Cash" ? "Cash" : "Bank";
  journal(
    db,
    receipt.id,
    receipt.date,
    `${receipt.number} · ${p.name}`,
    p.type === "Customer"
      ? [
          { account: cash, debit: amount },
          { account: "Accounts receivable", credit: amount },
        ]
      : [
          { account: "Accounts payable", debit: amount },
          { account: cash, credit: amount },
        ],
  );
  return db;
}
export function voidPayment(state, id) {
  const db = structuredClone(state),
    p = db.payments.find((p) => p.id === id);
  if (!p || p.void) throw Error("Payment already cancelled.");
  p.void = true;
  const original = {
    entries: db.journals
      .filter((j) => j.source === id)
      .flatMap((j) => j.entries),
  };
  journal(
    db,
    "void-" + id,
    today(),
    "Payment reversal · " + p.number,
    original.entries.map((e) => ({
      account: e.account,
      debit: e.credit,
      credit: e.debit,
    })),
  );
  return db;
}
export function postExpense(state, input) {
  const db = structuredClone(state),
    amount = positive(input.amount, "Taxable amount", false),
    gst = positive(input.gst || 0, "GST");
  if (!input.title.trim()) throw Error("Enter an expense title.");
  if (gst > 100) throw Error("GST cannot exceed 100%.");
  const tax = round((amount * gst) / 100),
    total = round(amount + tax),
    e = {
      ...input,
      id: uid(),
      date: input.date || today(),
      amount,
      tax,
      total,
    };
  db.expenses.push(e);
  journal(db, e.id, e.date, `Expense · ${e.title}`, [
    { account: `Expense: ${input.category}`, debit: amount },
    { account: "Input CGST", debit: round(tax / 2) },
    { account: "Input SGST", debit: round(tax - round(tax / 2)) },
    { account: input.mode === "Cash" ? "Cash" : "Bank", credit: total },
  ]);
  return db;
}
export function ledger(db) {
  const map = {};
  for (const j of db.journals)
    for (const e of j.entries) {
      map[e.account] ??= { account: e.account, debit: 0, credit: 0 };
      map[e.account].debit = round(map[e.account].debit + e.debit);
      map[e.account].credit = round(map[e.account].credit + e.credit);
    }
  return Object.values(map).sort((a, b) => a.account.localeCompare(b.account));
}
export function metrics(db) {
  const live = db.documents.filter((d) => !d.void),
    sales = live.filter((d) => d.type === "sale"),
    purchases = live.filter((d) => d.type === "purchase");
  const sum = (a, k) => round(a.reduce((s, x) => s + x[k], 0));
  const accounts = ledger(db),
    get = (a) => {
      const e = accounts.find((e) => e.account === a);
      return e ? round(e.debit - e.credit) : 0;
    };
  return {
    sales: sales
      .filter((d) => d.date === today())
      .reduce((s, d) => s + d.total, 0),
    revenue: sum(sales, "taxable"),
    purchases: sum(purchases, "total"),
    receivable: round(
      db.parties
        .filter((p) => p.type === "Customer")
        .reduce((s, p) => s + balance(db, p), 0),
    ),
    payable: round(
      db.parties
        .filter((p) => p.type === "Supplier")
        .reduce((s, p) => s + balance(db, p), 0),
    ),
    cash: round(
      get("Cash") + get("Bank") + Number(db.settings.openingCash || 0),
    ),
    stock: round(db.items.reduce((s, i) => s + i.stock * i.cost, 0)),
    low: db.items.filter((i) => i.stock <= i.min),
    expenses: sum(db.expenses, "amount"),
    output: sum(sales, "tax"),
    input: round(sum(purchases, "tax") + sum(db.expenses, "tax")),
    cogs: get("Cost of goods sold"),
    profit: round(
      sum(sales, "taxable") -
        get("Cost of goods sold") -
        sum(db.expenses, "amount"),
    ),
  };
}
export function validateBackup(value) {
  if (value?.version !== VERSION)
    throw Error("Unsupported backup version. Use a retailer ERP JSON backup.");
  for (const key of [
    "items",
    "parties",
    "documents",
    "payments",
    "expenses",
    "journals",
    "users",
  ])
    if (!Array.isArray(value[key])) throw Error(`Backup is missing ${key}.`);
  if (
    !value.settings ||
    typeof value.settings.name !== "string" ||
    !value.users.some((u) => u.role === "Admin")
  )
    throw Error("Invalid settings or administrator.");
  for (const u of value.users) {
    if (
      !u.id ||
      typeof u.name !== "string" ||
      !["Admin", "Staff"].includes(u.role) ||
      (u.credentials && !validCredential(u.credentials)) ||
      (u.recoveryCredentials && !validCredential(u.recoveryCredentials))
    )
      throw Error("Invalid operator credentials.");
  }
  const ids = new Set();
  for (const i of value.items) {
    if (typeof i.id !== "string" || !i.name || ids.has(i.id))
      throw Error("Invalid or duplicate item.");
    ids.add(i.id);
    for (const k of ["cost", "price", "min", "gst"]) positive(i[k], k);
    if (i.sourceProductId) finiteStock(i.stock);
    else positive(i.stock, "stock");
  }
  for (const p of value.parties) {
    if (!p.id || !p.name || !["Customer", "Supplier"].includes(p.type))
      throw Error("Invalid party.");
    positive(p.opening || 0, "Opening balance");
  }
  for (const j of value.journals) {
    if (!Array.isArray(j.entries)) throw Error("Invalid journal.");
    for (const e of j.entries) {
      if (typeof e.account !== "string") throw Error("Invalid account.");
      positive(e.debit, "Debit");
      positive(e.credit, "Credit");
    }
    if (Math.abs(j.entries.reduce((s, e) => s + e.debit - e.credit, 0)) > 0.02)
      throw Error("Backup has unbalanced journals.");
  }
  for (const d of value.documents) {
    if (!["sale", "purchase"].includes(d.type) || !Array.isArray(d.lines))
      throw Error("Invalid document.");
    for (const k of ["total", "taxable", "tax", "paid"]) positive(d[k], k);
    if (d.lines.some((l) => !ids.has(l.itemId)))
      throw Error("Document references a missing item.");
  }
  return value;
}
export function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("CSV has an unclosed quote.");
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  if (rows.length < 2)
    throw Error("CSV must contain a header and at least one item.");
  const headers = rows.shift().map((s) =>
    s
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase(),
  );
  return rows.map((r, i) => {
    if (r.length !== headers.length)
      throw Error(`CSV row ${i + 2} has an incorrect number of columns.`);
    return Object.fromEntries(headers.map((h, j) => [h, r[j].trim()]));
  });
}
export function importItems(db, text) {
  let next = structuredClone(db);
  const rows = parseCSV(text);
  for (const [index, r] of rows.entries()) {
    if (!r.name) throw Error(`Row ${index + 2}: name is required.`);
    const num = (k) => {
      if (r[k] === undefined || r[k] === "") return 0;
      const n = Number(r[k]);
      if (!Number.isFinite(n) || n < 0)
        throw Error(`Row ${index + 2}: invalid ${k}.`);
      return n;
    };
    next = saveItem(next, {
      name: r.name,
      category: r.category || "General",
      hsn: r.hsn || "",
      barcode: r.barcode || "",
      unit: r.unit || "PCS",
      cost: num("cost"),
      price: num("price"),
      stock: num("stock"),
      min: num("min"),
      gst: num("gst"),
    });
  }
  return next;
}
