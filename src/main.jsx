import { amountInWords, invoiceSummary } from "./lib/invoice-format.mjs";
import { version as APP_VERSION } from "../package.json";
import React, { useEffect, useRef, useState, useId } from "react";
import { createRoot } from "react-dom/client";
import {
  IconPackage,
  IconLayoutDashboard,
  IconBolt,
  IconReceipt,
  IconFileText,
  IconShoppingCart,
  IconUsers,
  IconCreditCard,
  IconArrowUpRight,
  IconCalculator,
  IconTrendingUp,
  IconFileSpreadsheet,
  IconCrown,
  IconSettings,
  IconDatabase,
  IconInbox,
  IconX,
  IconArrowDownLeft,
  IconWallet,
  IconUserPlus,
  IconPackageImport,
  IconChevronRight,
  IconAlertTriangle,
  IconShieldCheck,
  IconPlus,
  IconUpload,
  IconBarcode,
  IconCircleCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconBan,
  IconDeviceDesktop,
  IconDatabaseExport,
  IconDownload,
  IconRestore,
  IconInfoCircle,
  IconTrash,
  IconSun,
  IconMoon,
  IconSwitchHorizontal,
  IconSearch,
  IconBuildingStore,
  IconCalendar,
  IconMenu2,
  IconCheck,
  IconPencil,
  IconChartHistogram,
  IconDeviceFloppy,
  IconFileUpload,
  IconArrowLeft,
  IconScale,
  IconBuildingBank,
  IconPrinter,
} from "@tabler/icons-react";
const Icons = {
  IconPackage,
  IconLayoutDashboard,
  IconBolt,
  IconReceipt,
  IconFileText,
  IconShoppingCart,
  IconUsers,
  IconCreditCard,
  IconArrowUpRight,
  IconCalculator,
  IconTrendingUp,
  IconFileSpreadsheet,
  IconCrown,
  IconSettings,
  IconDatabase,
  IconInbox,
  IconX,
  IconArrowDownLeft,
  IconWallet,
  IconUserPlus,
  IconPackageImport,
  IconChevronRight,
  IconAlertTriangle,
  IconShieldCheck,
  IconPlus,
  IconUpload,
  IconBarcode,
  IconCircleCheck,
  IconClock,
  IconEye,
  IconEyeOff,
  IconBan,
  IconDeviceDesktop,
  IconDatabaseExport,
  IconDownload,
  IconRestore,
  IconInfoCircle,
  IconTrash,
  IconSun,
  IconMoon,
  IconSwitchHorizontal,
  IconSearch,
  IconBuildingStore,
  IconCalendar,
  IconMenu2,
  IconCheck,
  IconPencil,
  IconChartHistogram,
  IconDeviceFloppy,
  IconFileUpload,
  IconArrowLeft,
  IconScale,
  IconBuildingBank,
  IconPrinter,
};
import { STATES, stateName } from "./lib/medical-gst";
import { rupees as money } from "./lib/medical-format";
import {
  fresh,
  uid,
  today,
  financialYear,
  round,
  calculate,
  saveItem,
  saveParty,
  balance,
  postDocument,
  voidDocument,
  postPayment,
  documentPaid,
  voidPayment,
  postExpense,
  ledger,
  metrics,
  validateBackup,
  importItems,
} from "./lib/engine.mjs";
import {
  hashPassword,
  verifyPassword,
  changePassword,
  createRecoveryCode,
  recoverPassword,
} from "./lib/auth.mjs";
import {
  yearRange,
  validPeriod,
  periodPreset,
  scopeTransactions,
  inPeriod,
} from "./lib/period.mjs";
import suppliedCatalog from "./data/rahul-products.json";
import { applyProductCatalog } from "./lib/catalog.mjs";
import "./style.css";
const KEY = "retailer-erp:v1";
const nav = [
  [
    "GENERAL",
    [
      ["dashboard", "Dashboard", "LayoutDashboard"],
      ["pos", "Express POS", "Bolt", "Fast"],
      ["sales", "Sales & Invoices", "Receipt"],
      ["non-gst", "Non-GST Invoices", "FileText"],
      ["purchases", "Purchases", "ShoppingCart"],
    ],
  ],
  [
    "MANAGEMENT",
    [
      ["parties", "Parties (Customers/Vendors)", "Users"],
      ["items", "Items & Inventory", "Package"],
      ["payments", "Payment In & Out", "CreditCard"],
      ["expenses", "Expenses", "ArrowUpRight"],
    ],
  ],
  [
    "ACCOUNTING & GST",
    [
      ["accounting", "Double-Entry Accounting", "Calculator"],
      ["profit", "Profit & Loss (P&L)", "TrendingUp"],
      ["gst", "GST Filing Reports", "FileSpreadsheet", "GSTR"],
    ],
  ],
  [
    "SYSTEM & ADMIN",
    [
      ["admin", "Admin Panel & Roles", "Crown"],
      ["settings", "Business Settings", "Settings"],
      ["backup", "Backup & Data Export", "Database"],
      ["licence", "Licence & Renewal", "ShieldCheck"],
    ],
  ],
];
const allNav = nav.flatMap((g) => g[1]);
function Icon({ name = "Package", size = 20, ...props }) {
  const C = Icons["Icon" + name] || Icons.IconPackage;
  return <C size={size} stroke={1.7} {...props} />;
}
function Button({ children, icon, onClick, kind = "", ...p }) {
  return (
    <button className={`btn ${kind}`} onClick={onClick} {...p}>
      {icon && <Icon name={icon} size={18} />} {children}
    </button>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input({ label, visibilityKey, ...p }) {
  const id = useId();
  if (p.type === "password")
    return (
      <div className="field">
        <label className="input-label" htmlFor={p.id || id}>
          {label}
        </label>
        <PasswordInput
          key={`${label}-${visibilityKey || ""}`}
          label={label}
          {...p}
          id={p.id || id}
        />
      </div>
    );
  return (
    <Field label={label}>
      <input {...p} />
    </Field>
  );
}
function PasswordInput({ label, ...props }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div className="password-input">
      <input
        {...props}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        id={props.id || id}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        className="icon-btn password-eye"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        aria-controls={props.id || id}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
      >
        <Icon name={visible ? "EyeOff" : "Eye"} size={18} />
      </button>
    </div>
  );
}
function persistWorkspace(value) {
  window.retailDesktop.assertLicensed();
  localStorage.setItem(KEY, value);
}
function Select({ label, children, ...p }) {
  return (
    <Field label={label}>
      <select {...p}>{children}</select>
    </Field>
  );
}
function Badge({ children, color = "green" }) {
  return <span className={`badge ${color}`}>{children}</span>;
}
function Empty({
  title = "No records yet",
  text = "Your records will appear here once you add them.",
  action,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="Inbox" size={32} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Table({ heads, children, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
function Stat({ label, value, icon = "TrendingUp", color = "blue", note }) {
  return (
    <div className="stat panel">
      <div className="stat-top">
        <div>
          <div className="eyebrow">{label}</div>
          <strong>{value}</strong>
        </div>
        <span className={`stat-icon ${color}`}>
          <Icon name={icon} size={23} />
        </span>
      </div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
function download(name, text, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function csv(name, rows) {
  if (!rows.length) throw Error("There are no records to export.");
  const keys = Object.keys(rows[0]);
  const escape = (v) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  download(
    name,
    [
      keys.map(escape).join(","),
      ...rows.map((r) =>
        keys
          .map((k) =>
            escape(typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k]),
          )
          .join(","),
      ),
    ].join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = [
          ...ref.current.querySelectorAll(
            "button,input,select,textarea,a[href]",
          ),
        ].filter((x) => !x.disabled);
        if (!list.length) return;
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    ref.current.querySelector("input,button")?.focus();
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="X" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [problem, setProblem] = useState("");
  const [db, setDb] = useState(() => {
    try {
      const s = localStorage.getItem(KEY);
      const current = s ? validateBackup(JSON.parse(s)) : fresh();
      const next = applyProductCatalog(current, suppliedCatalog);
      if (next !== current) persistWorkspace(JSON.stringify(next));
      return next;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState(() => location.hash.slice(2) || "dashboard");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () =>
    setCollapsed((value) => !value);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(false);
  const [userId, setUserId] = useState(
    () => sessionStorage.getItem("retailer-user") || "owner",
  );
  const [draft, setDraft] = useState(null);
  const [signedIn, setSignedIn] = useState(null);
  const [period, setPeriod] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem("retailer-period"));
      return validPeriod(p) ? p : yearRange();
    } catch {
      return yearRange();
    }
  });
  const periodDb = db ? scopeTransactions(db, period) : null;
  const periodLabel = period.year === "all" ? "All years" : period.year;
  const rangeLabel =
    period.from && period.to
      ? `${period.from} → ${period.to}`
      : period.from
        ? `From ${period.from}`
        : period.to
          ? `Through ${period.to}`
          : "All dates";
  const lockWorkspace = () => {
    setSignedIn(null);
    setModal(null);
    setDraft(null);
    setSearch(false);
  };
  useEffect(() => {
    const sync = (e) => {
      if (e.key === KEY && e.newValue) {
        try {
          setDb(validateBackup(JSON.parse(e.newValue)));
        } catch {}
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const liveMetrics = db ? metrics(db) : {};
  const periodMetrics = periodDb ? metrics(periodDb) : {};
  const m = {
    ...periodMetrics,
    sales: periodDb
      ? periodDb.documents
          .filter((d) => !d.void && d.type === "sale")
          .reduce((sum, d) => sum + d.total, 0)
      : 0,
    ...Object.fromEntries(
      ["receivable", "payable", "cash", "stock", "low"].map((k) => [
        k,
        liveMetrics[k],
      ]),
    ),
  };
  const user =
    db?.users.find((u) => u.id === (signedIn?.id || userId)) || db?.users[0];
  const admin = user?.role === "Admin";
  const notify = (s) => {
    setToast(s);
    setTimeout(() => setToast(""), 4500);
  };
  const attempt = (fn) => {
    try {
      return fn();
    } catch (e) {
      notify(e.message);
    }
  };
  const commit = (next) => {
    try {
      persistWorkspace(JSON.stringify(next));
    } catch (error) {
      if (error?.name !== "QuotaExceededError") throw error;
      throw Error(
        "Could not save data. Browser storage may be full. Export a backup before continuing.",
      );
    }
    setDb(next);
  };
  const go = (p) => {
    location.hash = "/" + p;
    setPage(p);
    setMenu(false);
    setSearch(false);
    setQuery("");
  };
  const open = (type, data) => setModal({ type, data });
  const newDocument = (type = "sale", gst = true) => {
    setDraft({
      type,
      gst,
      partyId: "",
      date: today(),
      mode: "Cash",
      paid: 0,
      lines: [],
      notes: "",
      reference: "",
    });
    go(type === "purchase" ? "purchase-new" : "sale-new");
  };
  useEffect(() => {
    const hash = () => setPage(location.hash.slice(2) || "dashboard");
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, []);

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "F1") {
        e.preventDefault();
        newDocument();
      }
      if (["F4", "F5", "F6"].includes(e.key)) {
        e.preventDefault();
        open({ F4: "party", F5: "item", F6: "payment" }[e.key]);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (!db)
    return (
      <div className="recovery panel">
        <h1>Your saved data could not be opened</h1>
        <p>
          The stored data has been preserved. Download it before restoring a
          valid backup.
        </p>
        <Button
          onClick={() =>
            download("retailer-recovery.json", localStorage.getItem(KEY) || "")
          }
        >
          Download recovery data
        </Button>
        <label className="btn primary">
          Restore backup
          <input
            hidden
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const value = validateBackup(
                  JSON.parse(await e.target.files[0].text()),
                );
                persistWorkspace(JSON.stringify(value));
                setDb(value);
              } catch (e) {
                setProblem(e.message);
              }
            }}
          />
        </label>
        {problem && <p>{problem}</p>}
      </div>
    );
  if (
    !signedIn ||
    !db.users.some(
      (u) => u.id === signedIn.id && u.credentials?.hash === signedIn.hash,
    )
  )
    return (
      <LoginScreen
        db={db}
        selectedId={userId}
        onUnlock={(u, next) => {
          if (next) commit(next);
          setUserId(u.id);
          setSignedIn({ id: u.id, hash: u.credentials.hash });
          setPage("dashboard");
          location.hash = "/dashboard";
        }}
      />
    );
  const update = (fn, msg) =>
    attempt(() => {
      commit(fn(db));
      if (msg) notify(msg);
      setModal(null);
    });
  const exportRows = (name, rows) => attempt(() => csv(name, rows));
  const activeDocs = db.documents.filter((d) => !d.void);
  const allowed = admin || !["admin", "settings", "backup"].includes(page);
  const Head = ({ title, sub, children }) => (
    <div className="page-head">
      <div>
        <div className="breadcrumb">
          WORKSPACE <span>/</span>{" "}
          {allNav.find((n) => n[0] === page)?.[1] || title}
        </div>
        <h1>
          <Icon
            name={allNav.find((n) => n[0] === page)?.[2] || "LayoutDashboard"}
            size={24}
          />
          {title}
        </h1>
        <p>{sub}</p>
      </div>
      <div className="actions">{children}</div>
    </div>
  );
  const dashboard = () => (
    <>
      <section className="company-banner panel">
        <div>
          <div className="eyebrow blue-text">YOUR BUSINESS AT A GLANCE</div>
          <h1>{db.settings.name}</h1>
          <p>
            GSTIN: <b>{db.settings.gstin || "Not configured"}</b>
            <span className="separator">|</span> State:{" "}
            <b>
              {stateName(db.settings.state)} ({db.settings.state})
            </b>
            <span className="separator">|</span> FY:{" "}
            <b className="blue-text">{periodLabel}</b>
          </p>
        </div>
        <Badge>
          <span className="dot" /> GST accounting enabled
        </Badge>
      </section>
      <div className="stats five">
        <Stat
          label="SALES IN SELECTED PERIOD"
          value={money(m.sales)}
          icon="TrendingUp"
          note={rangeLabel}
        />
        <Stat
          label="TOTAL RECEIVABLE"
          value={money(m.receivable)}
          icon="ArrowDownLeft"
          color="green"
          note="From customers & debtors"
        />
        <Stat
          label="TOTAL PAYABLE"
          value={money(m.payable)}
          icon="ArrowUpRight"
          color="rose"
          note="To suppliers & creditors"
        />
        <Stat
          label="CASH & BANK BALANCE"
          value={money(m.cash)}
          icon="Wallet"
          color="purple"
          note="Liquid operating funds"
        />
        <Stat
          label="TOTAL STOCK VALUE"
          value={money(m.stock)}
          icon="Package"
          color="amber"
          note={
            m.low.length
              ? `${m.low.length} items need attention`
              : "Inventory healthy"
          }
        />
      </div>
      <section className="panel quick">
        <div className="section-heading">
          <h2 className="eyebrow">QUICK ACTION LAUNCHER</h2>
          <span className="muted small">
            Everything you need, one click away
          </span>
        </div>
        <div className="quick-grid">
          {[
            ["New Sale (F1)", "Receipt", "blue", () => newDocument()],
            ["Express POS", "Bolt", "amber", () => go("pos")],
            [
              "New Purchase",
              "ShoppingCart",
              "indigo",
              () => newDocument("purchase"),
            ],
            [
              "Receive Payment (F6)",
              "ArrowDownLeft",
              "green",
              () => open("payment"),
            ],
            ["Add Expense", "ArrowUpRight", "rose", () => open("expense")],
            ["Add Party (F4)", "UserPlus", "teal", () => open("party")],
            ["Add Item (F5)", "PackageImport", "purple", () => open("item")],
            ["GSTR Report", "FileSpreadsheet", "slate", () => go("gst")],
          ].map(([label, icon, color, fn]) => (
            <button
              key={label}
              className={`quick-action ${color}`}
              onClick={fn}
            >
              <Icon name={icon} />
              {label}
              <Icon name="ChevronRight" size={16} />
            </button>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="section-heading">
            <div>
              <h2>
                Revenue & Inward Trends{" "}
                <span className="muted small">(Last 7 Days)</span>
              </h2>
              <p>Daily sales vs purchase volumes</p>
            </div>
            <div className="legend">
              <span>
                <i className="blue-dot" />
                Sales
              </span>
              <span>
                <i className="rose-dot" />
                Purchases
              </span>
            </div>
          </div>
          <Trend db={periodDb} period={period} />
        </section>
        <section className="panel low-stock">
          <div className="section-heading">
            <div className="row">
              <span className="stat-icon amber">
                <Icon name="AlertTriangle" />
              </span>
              <div>
                <h2>Low Stock Reorder Alerts</h2>
                <p>Items below safety thresholds</p>
              </div>
            </div>
            <Badge color="amber">{m.low.length} Alerts</Badge>
          </div>
          {m.low.length ? (
            <div className="low-list">
              {m.low.slice(0, 5).map((i) => (
                <div className="row between" key={i.id}>
                  <span>{i.name}</span>
                  <Badge color="amber">
                    {i.stock} {i.unit}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="healthy">
              <Icon name="ShieldCheck" size={38} />
              <p>
                All inventory items are currently above minimum safety stock.
              </p>
            </div>
          )}
          <Button kind="full" onClick={() => go("items")}>
            Manage All Inventory <Icon name="ChevronRight" size={16} />
          </Button>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading padded">
          <div>
            <h2>Recent transactions</h2>
            <p>Your latest sales and purchases</p>
          </div>
          <Button onClick={() => go("sales")} kind="ghost">
            View all <Icon name="ArrowUpRight" size={16} />
          </Button>
        </div>
        <Table
          heads={["Invoice", "Date", "Party", "Type", "Amount", "Status"]}
          empty={
            !periodDb.documents.length && (
              <Empty
                title="Ready for your first transaction"
                text="Add your products and customers, then create your first invoice."
                action={
                  <Button onClick={() => open("item")} icon="Plus">
                    Add your first item
                  </Button>
                }
              />
            )
          }
        >
          {periodDb.documents
            .slice(-5)
            .reverse()
            .map((d) => (
              <tr
                key={d.id}
                onClick={() => open("invoice", d)}
                className="clickable"
              >
                <td className="blue-text">{d.number}</td>
                <td>{d.date}</td>
                <td>{d.partyName}</td>
                <td>{d.type}</td>
                <td>{money(d.total)}</td>
                <td>
                  <Status d={d} db={db} />
                </td>
              </tr>
            ))}
        </Table>
      </section>
    </>
  );
  let content;
  if (page === "dashboard") content = dashboard();
  else if (page === "items")
    content = (
      <>
        <Head
          title="Items & Inventory Management"
          sub="Maintain stock quantities, pricing, HSN codes, barcodes, and item details."
        >
          <Button icon="Upload" onClick={() => open("import")}>
            Import CSV
          </Button>
          <Button icon="Plus" kind="primary" onClick={() => open("item")}>
            Add New Product
          </Button>
        </Head>
        <div className="stats">
          <Stat label="TOTAL STOCK VALUATION" value={money(m.stock)} />
          <Stat
            label="TOTAL CATALOG SKUS"
            value={`${db.items.length} items`}
            icon="Barcode"
            color="purple"
          />
          <Stat
            label="LOW STOCK ALERTS"
            value={`${m.low.length} reorder items`}
            icon="AlertTriangle"
            color="amber"
          />
        </div>
        <Records
          key={`${page}-${period.from}-${period.to}`}
          items={db.items}
          placeholder="Search name, category, HSN or barcode…"
          onExport={(rows) => exportRows("inventory.csv", rows)}
          filterKey="category"
          heads={[
            "Item Name",
            "Category",
            "HSN / Barcode",
            "Purchase Price",
            "Sale Price",
            "GST %",
            "Current Stock",
            "Stock Value",
            "Actions",
          ]}
          render={(i) => (
            <tr key={i.id}>
              <td>
                <b>{i.name}</b>
                <small>
                  {i.unit} · Added {i.date}
                </small>
              </td>
              <td>{i.category || "General"}</td>
              <td>
                {i.hsn || "—"}
                <small>{i.barcode}</small>
              </td>
              <td>{money(i.cost)}</td>
              <td>{money(i.price)}</td>
              <td>{i.gst}%</td>
              <td>
                <Badge color={i.stock <= i.min ? "amber" : "green"}>
                  {i.stock} {i.unit}
                </Badge>
              </td>
              <td>{money(i.stock * i.cost)}</td>
              <td>
                <RowActions
                  edit={() => open("item", i)}
                  remove={() =>
                    open("confirm", {
                      title: "Delete product?",
                      text: "Products with transactions cannot be deleted.",
                      run: () =>
                        update((s) => {
                          if (
                            s.documents.some((d) =>
                              d.lines.some((l) => l.itemId === i.id),
                            )
                          )
                            throw Error(
                              "This product has transactions. Keep it for your records.",
                            );
                          if (i.stock > 0)
                            throw Error("Set stock to zero before deleting.");
                          return {
                            ...s,
                            items: s.items.filter((x) => x.id !== i.id),
                          };
                        }, "Product deleted"),
                    })
                  }
                />
              </td>
            </tr>
          )}
          emptyTitle="Your inventory starts here"
          emptyText="Add a product or import your inventory CSV. Your real data will stay in this browser."
        />
      </>
    );
  else if (page === "parties")
    content = (
      <>
        <Head
          title="Parties Directory"
          sub="Customers, suppliers, transaction history, and outstanding balances."
        >
          <Button kind="primary" icon="UserPlus" onClick={() => open("party")}>
            Add New Party (F4)
          </Button>
        </Head>
        <div className="stats two">
          <Stat
            label="TOTAL CUSTOMER RECEIVABLES"
            value={money(m.receivable)}
            color="green"
            icon="ArrowDownLeft"
          />
          <Stat
            label="TOTAL SUPPLIER PAYABLES"
            value={money(m.payable)}
            color="rose"
            icon="ArrowUpRight"
          />
        </div>
        <Records
          key={`${page}-${period.from}-${period.to}`}
          items={db.parties}
          filterKey="type"
          placeholder="Search parties, phone, or GSTIN…"
          onExport={(rows) =>
            exportRows(
              "parties.csv",
              rows.map((p) => ({ ...p, balance: balance(db, p) })),
            )
          }
          heads={[
            "Party Name",
            "Type",
            "Contact",
            "GSTIN & State",
            "Credit Limit",
            "Current Balance",
            "Actions",
          ]}
          render={(p) => (
            <tr key={p.id}>
              <td>
                <button className="text-btn" onClick={() => open("history", p)}>
                  {p.name}
                </button>
                <small>{p.date}</small>
              </td>
              <td>
                <Badge color={p.type === "Customer" ? "blue" : "purple"}>
                  {p.type}
                </Badge>
              </td>
              <td>
                {p.phone || "—"}
                <small>{p.email}</small>
              </td>
              <td>
                {p.gstin || "Unregistered"}
                <small>{stateName(p.state)}</small>
              </td>
              <td>{money(p.creditLimit)}</td>
              <td>{money(balance(db, p))}</td>
              <td>
                <RowActions
                  edit={() => open("party", p)}
                  remove={() =>
                    open("confirm", {
                      title: "Delete party?",
                      text: "Parties with transactions or opening balances cannot be deleted.",
                      run: () =>
                        update((s) => {
                          if (
                            s.documents.some((d) => d.partyId === p.id) ||
                            s.payments.some((x) => x.partyId === p.id) ||
                            p.opening
                          )
                            throw Error("This party has financial records.");
                          return {
                            ...s,
                            parties: s.parties.filter((x) => x.id !== p.id),
                          };
                        }, "Party deleted"),
                    })
                  }
                />
              </td>
            </tr>
          )}
          emptyTitle="A place for every business relationship"
          emptyText="Add customers and suppliers to track their invoices and payments."
        />
      </>
    );
  else if (["sales", "non-gst", "purchases"].includes(page)) {
    const purchase = page === "purchases",
      docs = periodDb.documents.filter((d) =>
        purchase
          ? d.type === "purchase"
          : d.type === "sale" && d.gst === (page === "sales"),
      );
    content = (
      <>
        <Head
          title={
            purchase
              ? "Purchases & Vendor Inward"
              : page === "sales"
                ? "Sales & Invoices"
                : "Non-GST Invoices"
          }
          sub={
            purchase
              ? "Record supplier bills, update stock automatically, and manage accounts payable."
              : "Manage your invoices, payments, and customer balances."
          }
        >
          <Button
            kind="primary"
            icon="Plus"
            onClick={() =>
              newDocument(purchase ? "purchase" : "sale", page !== "non-gst")
            }
          >
            {purchase ? "Record Purchase Bill" : "Create Invoice"}
          </Button>
        </Head>
        <div className="stats">
          <Stat
            label="TOTAL BILLING"
            value={money(
              docs.filter((d) => !d.void).reduce((s, d) => s + d.total, 0),
            )}
            note={`${docs.length} documents`}
          />
          <Stat
            label="AMOUNT RECEIVED / PAID"
            value={money(
              docs
                .filter((d) => !d.void)
                .reduce((s, d) => s + documentPaid(db, d), 0),
            )}
            color="green"
            icon="CircleCheck"
          />
          <Stat
            label="OUTSTANDING ON INVOICES"
            value={money(
              docs
                .filter((d) => !d.void)
                .reduce((s, d) => s + d.total - documentPaid(db, d), 0),
            )}
            note="Includes automatic allocations from later payments"
            color="amber"
            icon="Clock"
          />
        </div>
        <Records
          key={`${page}-${period.from}-${period.to}`}
          items={docs.map((d) => ({
            ...d,
            status: d.void
              ? "CANCELLED"
              : documentPaid(db, d) >= d.total
                ? "PAID"
                : documentPaid(db, d)
                  ? "PARTIAL"
                  : "UNPAID",
          }))}
          filterKey="status"
          onExport={(r) =>
            exportRows(
              purchase ? "purchases.csv" : "sales.csv",
              r.map(({ lines, ...d }) => d),
            )
          }
          placeholder="Search invoice number, party, or date…"
          heads={[
            "Invoice No",
            "Date",
            "Party",
            "Mode",
            "Taxable",
            "GST",
            "Grand Total",
            "Status",
            "Actions",
          ]}
          render={(d) => (
            <tr key={d.id}>
              <td>
                <button className="text-btn" onClick={() => open("invoice", d)}>
                  {d.number}
                </button>
              </td>
              <td>{d.date}</td>
              <td>{d.partyName}</td>
              <td>{d.mode}</td>
              <td>{money(d.taxable)}</td>
              <td>{money(d.tax)}</td>
              <td>
                <b>{money(d.total)}</b>
              </td>
              <td>
                <Status d={d} db={db} />
              </td>
              <td>
                <button
                  className="icon-btn"
                  title="View invoice"
                  onClick={() => open("invoice", d)}
                >
                  <Icon name="Eye" size={18} />
                </button>
                {!d.void && admin && (
                  <button
                    className="icon-btn danger-text"
                    title="Cancel invoice"
                    onClick={() =>
                      open("confirm", {
                        title: "Cancel this invoice?",
                        text: "Stock and accounting will be reversed. The cancelled document remains in the register.",
                        run: () =>
                          update(
                            (s) => voidDocument(s, d.id),
                            "Invoice cancelled",
                          ),
                      })
                    }
                  >
                    <Icon name="Ban" size={18} />
                  </button>
                )}
              </td>
            </tr>
          )}
          emptyTitle={purchase ? "No purchase bills yet" : "No invoices yet"}
          emptyText="Create your first document to start your register."
        />
      </>
    );
  } else if (["sale-new", "purchase-new", "pos"].includes(page))
    content = (
      <DocumentEditor
        key={`${page}-${period.from}-${period.to}`}
        db={db}
        initial={
          page === "pos"
            ? {
                type: "sale",
                gst: true,
                date: today(),
                lines: [],
                partyId: "",
                mode: "Cash",
                paid: 0,
              }
            : draft || {
                type: page === "purchase-new" ? "purchase" : "sale",
                gst: true,
                date: today(),
                lines: [],
                partyId: "",
                mode: "Cash",
                paid: 0,
              }
        }
        pos={page === "pos"}
        onAddSupplier={(onCreated) =>
          setModal({
            type: "party",
            data: {
              name: "", type: "Supplier", phone: "", email: "", gstin: "",
              state: db.settings.state, address: "", opening: 0, creditLimit: 0,
            },
            onSaved: onCreated,
          })
        }
        onBack={() => go(page === "purchase-new" ? "purchases" : "sales")}
        onSave={(f) =>
          attempt(() => {
            const { db: next, doc } = postDocument(db, f);
            commit(next);
            setDraft(null);
            notify(
              inPeriod(doc.date, period)
                ? "Saved. Stock and accounting updated."
                : `Saved ${doc.number}. Invoice date ${doc.date} is outside the selected reporting period.`,
            );
            if (page === "pos") {
              setDraft(null);
              open("invoice", doc);
              go("pos");
            } else {
              go(
                f.type === "purchase"
                  ? "purchases"
                  : f.gst
                    ? "sales"
                    : "non-gst",
              );
              open("invoice", doc);
            }
            return true;
          })
        }
      />
    );
  else if (page === "payments")
    content = (
      <>
        <Head
          title="Payments In & Out"
          sub="Record collections and vendor payouts against party balances."
        >
          <Button
            icon="ArrowUpRight"
            onClick={() => open("payment", { type: "Out" })}
          >
            Payment Out
          </Button>
          <Button
            kind="primary"
            icon="ArrowDownLeft"
            onClick={() => open("payment", { type: "In" })}
          >
            Payment In
          </Button>
        </Head>
        <div className="stats two">
          <Stat
            label="TOTAL COLLECTIONS (PAYMENT IN)"
            value={money(
              periodDb.payments
                .filter((p) => p.type === "In" && !p.void)
                .reduce((s, p) => s + p.amount, 0),
            )}
            color="green"
          />
          <Stat
            label="TOTAL VENDOR PAYOUTS (PAYMENT OUT)"
            value={money(
              periodDb.payments
                .filter((p) => p.type === "Out" && !p.void)
                .reduce((s, p) => s + p.amount, 0),
            )}
            color="rose"
          />
        </div>
        <Records
          key={`${page}-${period.from}-${period.to}`}
          items={periodDb.payments}
          filterKey="mode"
          onExport={(rows) => exportRows("payments.csv", rows)}
          heads={[
            "Receipt No",
            "Date",
            "Type",
            "Party",
            "Mode & Ref",
            "Amount",
            "Actions",
          ]}
          render={(p) => (
            <tr key={p.id}>
              <td>{p.number}</td>
              <td>
                {p.date}
                <small>
                  {new Date(p.createdAt).toLocaleTimeString("en-IN")}
                </small>
              </td>
              <td>
                <Badge color={p.type === "In" ? "green" : "rose"}>
                  {p.void ? "CANCELLED" : `Payment ${p.type}`}
                </Badge>
              </td>
              <td>{p.partyName}</td>
              <td>
                {p.mode}
                <small>{p.reference}</small>
              </td>
              <td>
                {money(p.amount)}
                <small>
                  {p.allocations?.length
                    ? `${p.allocations.length} allocation(s)`
                    : ""}
                </small>
              </td>
              <td>
                {!p.void && admin && (
                  <button
                    className="icon-btn danger-text"
                    title="Reverse payment"
                    onClick={() =>
                      open("confirm", {
                        title: "Reverse payment?",
                        text: "The receipt is preserved. Party balances and invoice payment allocations will be reversed.",
                        run: () =>
                          update(
                            (s) => voidPayment(s, p.id),
                            "Payment reversed",
                          ),
                      })
                    }
                  >
                    <Icon name="Ban" size={18} />
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </>
    );
  else if (page === "expenses")
    content = (
      <>
        <Head
          title="Operating & Shop Expenses"
          sub="Track rent, electricity, salaries, and input tax on business expenses."
        >
          <Button kind="primary" icon="Plus" onClick={() => open("expense")}>
            Record Expense
          </Button>
        </Head>
        <div className="stats two">
          <Stat
            label="TOTAL EXPENSES RECORDED"
            value={money(periodDb.expenses.reduce((s, e) => s + e.total, 0))}
            color="rose"
          />
          <Stat
            label="GST INPUT ON EXPENSES"
            value={money(periodDb.expenses.reduce((s, e) => s + e.tax, 0))}
            color="green"
          />
        </div>
        <Records
          key={`${page}-${period.from}-${period.to}`}
          items={periodDb.expenses}
          filterKey="category"
          onExport={(r) => exportRows("expenses.csv", r)}
          heads={[
            "Date",
            "Expense Title",
            "Category",
            "Vendor",
            "Mode",
            "GST",
            "Total",
          ]}
          render={(e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.title}</td>
              <td>{e.category}</td>
              <td>{e.vendor || "—"}</td>
              <td>{e.mode}</td>
              <td>{money(e.tax)}</td>
              <td>{money(e.total)}</td>
            </tr>
          )}
        />
      </>
    );
  else if (["accounting", "profit", "gst"].includes(page))
    content = (
      <Reports
        key={`${page}-${period.from}-${period.to}`}
        db={periodDb}
        period={period}
        page={page}
        Head={Head}
        onExport={exportRows}
      />
    );
  else if (page === "licence")
    content = (
      <>
        <Head
          title="Annual Licence & Renewal"
          sub="Each shop licence is valid for one year and is tied to this computer."
        />
        <LicenceSettings />
      </>
    );
  else if (page === "settings")
    content = (
      <>
        <Head
          title="Business & Billing Settings"
          sub="Configure your business profile, bank details, and invoice print format."
        />
        <Settings
          db={db}
          onSave={(settings) =>
            attempt(() => {
              commit({ ...db, settings });
              notify("Business settings saved");
            })
          }
        />
      </>
    );
  else if (page === "backup")
    content = (
      <>
        <Head
          title="Backup & Data Export Center"
          sub="Download your complete local data, restore a backup, or import inventory."
        />
        <div className="notice">
          <Icon name="DeviceDesktop" />
          Browser local storage is active. Data belongs to this browser and
          device. Export backups regularly.
        </div>
        <div className="backup-grid">
          <section className="panel padded">
            <div className="feature-icon blue">
              <Icon name="DatabaseExport" size={28} />
            </div>
            <h2>Full system JSON snapshot</h2>
            <p>
              Business settings, products, parties, invoices, purchases,
              payments, expenses, and journals in one restorable file.
            </p>
            <Button
              kind="primary"
              icon="Download"
              onClick={() =>
                download(
                  `retailer-backup-${today()}.json`,
                  JSON.stringify(db, null, 2),
                )
              }
            >
              Download Full Backup
            </Button>
          </section>
          <section className="panel padded">
            <div className="feature-icon purple">
              <Icon name="Restore" size={28} />
            </div>
            <h2>Restore a backup</h2>
            <p>
              Select a retailer ERP JSON backup. You can inspect its record
              counts before replacing the current workspace.
            </p>
            <label className="btn">
              <Icon name="Upload" size={18} /> Select Backup File
              <input
                hidden
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file)
                    file.text().then((t) =>
                      attempt(() => {
                        const incoming = validateBackup(JSON.parse(t));
                        open("confirm", {
                          title: "Restore this backup?",
                          text: `Replace current data with ${incoming.items.length} products, ${incoming.parties.length} parties and ${incoming.documents.length} documents. A copy of current data will download first.`,
                          run: () =>
                            attempt(() => {
                              download(
                                `before-restore-${today()}.json`,
                                JSON.stringify(db, null, 2),
                              );
                              commit(incoming);
                              setModal(null);
                              notify("Backup restored");
                            }),
                        });
                      }),
                    );
                  e.target.value = "";
                }}
              />
            </label>
          </section>
          <section className="panel padded">
            <div className="feature-icon green">
              <Icon name="FileSpreadsheet" size={28} />
            </div>
            <h2>Excel / CSV worksheets</h2>
            <p>
              Export registers for your accountant or open them in Excel and
              Google Sheets.
            </p>
            <div className="export-grid">
              {[
                ["Inventory Stock", db.items],
                ["Customers & Vendors", db.parties],
                [
                  "Sales Register",
                  db.documents
                    .filter((d) => d.type === "sale")
                    .map(({ lines, ...d }) => d),
                ],
                [
                  "Purchase Bills",
                  db.documents
                    .filter((d) => d.type === "purchase")
                    .map(({ lines, ...d }) => d),
                ],
              ].map(([label, data]) => (
                <Button
                  key={label}
                  icon="Download"
                  onClick={() => exportRows(label + ".csv", data)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </section>
          <section className="panel padded">
            <div className="feature-icon amber">
              <Icon name="PackageImport" size={28} />
            </div>
            <h2>Bring your inventory</h2>
            <p>
              Import a CSV of your real products, rates, GST percentages, and
              opening stock. Imports are checked before saving.
            </p>
            <Button icon="Upload" onClick={() => open("import")}>
              Import Inventory CSV
            </Button>
          </section>
        </div>
        <section className="panel padded danger-zone">
          <div>
            <h2>Reset transaction data</h2>
            <p>
              Remove all products, parties, transactions, and journals. Business
              settings and operators are preserved.
            </p>
          </div>
          <Button kind="danger" onClick={() => open("reset")}>
            Reset Test Data
          </Button>
        </section>
      </>
    );
  else if (page === "admin")
    content = (
      <>
        <Head
          title="Admin Panel & Roles"
          sub="Manage local workspace operators. These roles control the interface on this device."
        >
          <Button kind="primary" icon="UserPlus" onClick={() => open("user")}>
            Add Operator
          </Button>
        </Head>
        <div className="notice">
          <Icon name="InfoCircle" />
          Operators sign in with their own password. Keep device access and
          exported backups private.
        </div>
        <Table heads={["Operator", "Role", "Access", "Actions"]}>
          {db.users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>
                <Badge color={u.role === "Admin" ? "purple" : "blue"}>
                  {u.role}
                </Badge>
              </td>
              <td>
                {u.role === "Admin"
                  ? "All modules and settings"
                  : "Sales, inventory, parties, payments, and reports"}
              </td>
              <td>
                <Button
                  kind="ghost"
                  onClick={() =>
                    u.id === user.id
                      ? open("password")
                      : open("resetPassword", u)
                  }
                >
                  {u.id === user.id ? "Change password" : "Reset password"}
                </Button>
                {u.id !== user.id && (
                  <button
                    className="icon-btn danger-text"
                    title="Remove operator"
                    onClick={() =>
                      open("confirm", {
                        title: "Remove operator?",
                        text: u.name,
                        run: () =>
                          update((s) => {
                            if (
                              u.role === "Admin" &&
                              s.users.filter((x) => x.role === "Admin")
                                .length === 1
                            )
                              throw Error("Keep at least one administrator.");
                            return {
                              ...s,
                              users: s.users.filter((x) => x.id !== u.id),
                            };
                          }, "Operator removed"),
                      })
                    }
                  >
                    <Icon name="Trash" size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </>
    );
  else
    content = (
      <Empty
        title="Page not found"
        action={
          <Button onClick={() => go("dashboard")}>Back to dashboard</Button>
        }
      />
    );
  const searchMatches = query.trim()
    ? db.items
        .filter((i) =>
          `${i.name} ${i.barcode}`.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : [];
  return (
    <>
      <aside
        className={`sidebar ${menu ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
      >
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <b>{db.settings.name.replace(" COMPANY", "")}</b>
            <small>{db.settings.gstin || "Retail ERP"}</small>
          </div>
        </div>
        <nav>
          {nav.map(([group, links]) => (
            <div className="nav-group" key={group}>
              <div className="nav-label">{group}</div>
              {links
                .filter(
                  (n) =>
                    admin || !["admin", "settings", "backup"].includes(n[0]),
                )
                .map(([id, label, icon, badge]) => (
                  <button
                    key={id}
                    title={label}
                    aria-label={label}
                    className={`nav-link ${page === id ? "active" : ""}`}
                    onClick={() => go(id)}
                  >
                    <Icon name={icon} size={21} />
                    <span>{label}</span>
                    {badge && <Badge color="blue">{badge}</Badge>}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="profile" onClick={() => open("switch")}>
            <span className="avatar">{user.name[0]}</span>
            <span>
              {user.name}
              <small>{user.role}</small>
            </span>
            <Icon name="SwitchHorizontal" size={20} />
          </button>
        </div>
      </aside>
      <div className={`app-shell ${collapsed ? "expanded" : ""}`}>
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() =>
              window.innerWidth <= 850 ? setMenu(!menu) : toggleSidebar()
            }
            aria-label="Toggle navigation"
            title="Expand / collapse navigation (Ctrl+B)"
            aria-expanded={
              typeof window !== "undefined" && window.innerWidth <= 850
                ? menu
                : !collapsed
            }
          >
            <Icon name="Menu2" />
          </button>
          <div className="global-search">
            <Icon name="Search" />
            <input
              id="global-search"
              placeholder="Search invoices, items, actions…"
              value={query}
              onFocus={() => setSearch(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearch(true);
              }}
            />
            <kbd>Ctrl + K</kbd>
            {search && (
              <div className="search-dropdown">
                <div className="row between">
                  <span className="eyebrow">
                    {query ? "SEARCH RESULTS" : "QUICK NAVIGATION"}
                  </span>
                  <button
                    className="icon-btn"
                    onClick={() => setSearch(false)}
                    aria-label="Close search"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
                {allNav
                  .filter(
                    (n) =>
                      (admin ||
                        !["admin", "settings", "backup"].includes(n[0])) &&
                      n[1].toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((n) => (
                    <button key={n[0]} onClick={() => go(n[0])}>
                      <Icon name={n[2]} />
                      {n[1]}
                      <Icon name="ArrowUpRight" size={16} />
                    </button>
                  ))}
                {searchMatches.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => {
                      go("items");
                      open("item", i);
                    }}
                  >
                    <Icon name="Package" />
                    {i.name}
                    <span>{money(i.price)}</span>
                  </button>
                ))}
                {db.documents
                  .filter(
                    (d) =>
                      query &&
                      `${d.number} ${d.partyName}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  )
                  .slice(-5)
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        open("invoice", d);
                        setSearch(false);
                      }}
                    >
                      <Icon name="Receipt" />
                      {d.number} · {d.partyName}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <Button kind="pos-btn" icon="Bolt" onClick={() => go("pos")}>
            POS Billing
          </Button>
          <Button kind="primary" icon="Plus" onClick={() => newDocument()}>
            New Sale
          </Button>
          <button
            type="button"
            className="fy period-trigger"
            aria-label="Change financial year and date range"
            onClick={() => open("period")}
            title="Change transaction reporting period"
          >
            <Icon name="Calendar" size={18} />
            <span>
              <b>FY {periodLabel}</b>
              <small>{rangeLabel}</small>
            </span>
            <Icon name="ChevronRight" size={14} />
          </button>
          <div className="top-company">
            <Icon name="BuildingStore" className="blue-text" />
            <div>
              <b>{db.settings.name}</b>
              <small>{db.settings.gstin}</small>
            </div>
          </div>
          <button
            className="admin-chip"
            onClick={() => (admin ? go("admin") : open("switch"))}
          >
            <Icon name="Crown" size={19} />
            {user.role}
          </button>
          <button
            className="avatar outline"
            onClick={() => open("switch")}
            title="Your Account"
          >
            {user.name[0]}
          </button>
        </header>
        <main
          className={
            ["pos", "sale-new", "purchase-new"].includes(page)
              ? "billing-workspace"
              : [
                    "items",
                    "parties",
                    "sales",
                    "non-gst",
                    "purchases",
                    "payments",
                    "expenses",
                    "accounting",
                    "gst",
                    "admin",
                  ].includes(page)
                ? "records-workspace"
                : ""
          }
        >
          <LicenceNotice onRenew={() => go("licence")} />
          {allowed ? (
            content
          ) : (
            <Empty
              title="Administrator access required"
              text="Switch to an administrator profile to manage this module."
              action={
                <Button onClick={() => open("switch")}>Switch Operator</Button>
              }
            />
          )}
          <footer className="app-footer">
            <span>
              Retail ERP <span className="muted">/</span> {periodLabel}
            </span>
            <span>
              <span className="dot" /> All changes saved on this device
            </span>
          </footer>
        </main>
      </div>
      {menu && <div className="sidebar-scrim" onClick={() => setMenu(false)} />}
      {toast && (
        <div className="toast" role="status">
          <Icon name="InfoCircle" size={20} />
          {toast}
          <button
            className="icon-btn"
            onClick={() => setToast("")}
            aria-label="Dismiss"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              item: modal.data ? "Edit Product" : "Add New Product",
              party: modal.data?.id
                ? "Edit Party"
                : modal.onSaved
                  ? "Add New Supplier"
                  : "Add New Party",
              payment: "Record Payment",
              expense: "Record Expense",
              import: "Import Inventory",
              invoice: "Invoice Details",
              history: "Party Statement",
              confirm: modal.data?.title,
              reset: "Reset Test Data",
              user: "Add Local Operator",
              switch: "Your Account",
              password: "Change Password",
              resetPassword: "Reset Operator Password",
              period: "Financial Year & Date Range",
            }[modal.type]
          }
          wide={["invoice", "history", "item", "party"].includes(modal.type)}
          onClose={() => setModal(null)}
        >
          {modal.type === "item" && (
            <MasterForm
              type="item"
              data={modal.data}
              onCancel={() => setModal(null)}
              onSave={(f) => update((s) => saveItem(s, f), "Product saved")}
            />
          )}
          {modal.type === "party" && (
            <MasterForm
              type="party"
              lockPartyType={Boolean(modal.onSaved)}
              data={modal.data}
              onCancel={() => setModal(null)}
              onSave={(f) => {
                if (!modal.onSaved)
                  return update((s) => saveParty(s, f), "Party saved");
                return attempt(() => {
                  const next = saveParty(db, { ...f, type: "Supplier" });
                  commit(next);
                  modal.onSaved(next.parties[next.parties.length - 1].id);
                  setModal(null);
                  notify("Supplier saved");
                });
              }}
            />
          )}
          {modal.type === "payment" && (
            <PaymentForm
              db={db}
              initial={modal.data}
              onSave={(f) =>
                update((s) => postPayment(s, f), "Payment recorded")
              }
            />
          )}
          {modal.type === "expense" && (
            <ExpenseForm
              onSave={(f) =>
                update((s) => postExpense(s, f), "Expense recorded")
              }
            />
          )}
          {modal.type === "import" && (
            <ImportForm
              onImport={(text) =>
                update((s) => importItems(s, text), "Inventory imported")
              }
            />
          )}
          {modal.type === "invoice" && (
            <Invoice
              doc={
                db.documents.find((d) => d.id === modal.data.id) || modal.data
              }
              settings={db.settings}
              db={db}
            />
          )}
          {modal.type === "history" && (
            <PartyHistory
              party={modal.data}
              db={db}
              onInvoice={(d) => open("invoice", d)}
            />
          )}
          {modal.type === "confirm" && (
            <div className="modal-body">
              <p>{modal.data.text}</p>
              <div className="form-footer">
                <Button onClick={() => setModal(null)}>Cancel</Button>
                <Button kind="primary" onClick={modal.data.run}>
                  Confirm
                </Button>
              </div>
            </div>
          )}
          {modal.type === "reset" && (
            <ResetForm
              onReset={() =>
                attempt(() => {
                  download(
                    `before-reset-${today()}.json`,
                    JSON.stringify(db, null, 2),
                  );
                  commit({
                    ...fresh(),
                    catalogImports: db.catalogImports,
                    settings: db.settings,
                    users: db.users,
                  });
                  setModal(null);
                  notify("Workspace reset; backup downloaded");
                })
              }
            />
          )}
          {modal.type === "period" && (
            <PeriodForm
              db={db}
              current={period}
              onApply={(p) => {
                localStorage.setItem("retailer-period", JSON.stringify(p));
                setPeriod(p);
                setModal(null);
              }}
            />
          )}
          {modal.type === "password" && (
            <PasswordForm
              onSave={async (current, next) => {
                const updated = await changePassword(
                  db,
                  user.id,
                  current,
                  next,
                );
                commit(updated);
                setSignedIn({
                  id: user.id,
                  hash: updated.users.find((u) => u.id === user.id).credentials
                    .hash,
                });
                setModal(null);
                notify("Password changed");
              }}
            />
          )}
          {modal.type === "resetPassword" && admin && (
            <PasswordForm
              resetName={modal.data.name}
              onSave={async (current, next) => {
                if (!(await verifyPassword(current, user.credentials)))
                  throw Error("Your administrator password is incorrect.");
                const credentials = await hashPassword(next);
                commit({
                  ...db,
                  users: db.users.map((u) =>
                    u.id === modal.data.id ? { ...u, credentials } : u,
                  ),
                });
                setModal(null);
                notify("Operator password reset");
              }}
            />
          )}
          {modal.type === "user" && (
            <UserForm
              onSave={(f) =>
                update(
                  (s) => ({ ...s, users: [...s.users, { ...f, id: uid() }] }),
                  "Operator added",
                )
              }
            />
          )}
          {modal.type === "switch" && (
            <div className="modal-body switch-list">
              <div className="account-actions">
                <Button onClick={() => open("password")}>
                  Change Password
                </Button>
                <Button
                  onClick={() => {
                    setModal(null);
                    go("licence");
                  }}
                >
                  Licence & Renewal
                </Button>
                <Button onClick={lockWorkspace}>Sign Out</Button>
              </div>
              <p className="small muted">
                Switching operators requires their password.
              </p>
              {db.users.map((u) => (
                <button
                  className="switch-user"
                  key={u.id}
                  onClick={() => {
                    if (u.id !== user.id) {
                      setUserId(u.id);
                      lockWorkspace();
                    } else setModal(null);
                  }}
                >
                  <span className="avatar">{u.name[0]}</span>
                  <div>
                    <b>{u.name}</b>
                    <small>{u.role}</small>
                  </div>
                  {u.id === user.id && (
                    <Icon name="Check" className="green-text" />
                  )}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
function Status({ d, db }) {
  return (
    <Badge
      color={
        d.void
          ? "rose"
          : documentPaid(db, d) >= d.total
            ? "green"
            : documentPaid(db, d)
              ? "amber"
              : "slate"
      }
    >
      {d.void
        ? "CANCELLED"
        : documentPaid(db, d) >= d.total
          ? "PAID"
          : documentPaid(db, d)
            ? "PARTIAL"
            : "UNPAID"}
    </Badge>
  );
}
function RowActions({ edit, remove }) {
  return (
    <div className="row">
      <button title="Edit" className="icon-btn" onClick={edit}>
        <Icon name="Pencil" size={17} />
      </button>
      <button title="Delete" className="icon-btn danger-text" onClick={remove}>
        <Icon name="Trash" size={17} />
      </button>
    </div>
  );
}
function Records({
  items,
  heads,
  render,
  filterKey,
  onExport,
  placeholder = "Search records…",
  emptyTitle = "No records yet",
  emptyText = "New records will appear here.",
}) {
  const [requestedPage, setRequestedPage] = useState(1);
  const pageSize = 20;
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("All"),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const matches = items.filter(
    (i) =>
      Object.values(i)
        .filter((v) => typeof v !== "object")
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (filter === "All" || i[filterKey] === filter) &&
      (!start || i.date >= start) &&
      (!end || i.date <= end),
  );
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const visible = matches.slice(offset, offset + pageSize);
  return (
    <section className="panel records">
      <div className="record-toolbar">
        <div className="inline-search">
          <Icon name="Search" size={18} />
          <input
            placeholder={placeholder}
            aria-label="Search records"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setRequestedPage(1);
            }}
          />
        </div>
        {filterKey && (
          <select
            aria-label={`Filter by ${filterKey}`}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setRequestedPage(1);
            }}
          >
            <option>All</option>
            {[...new Set(items.map((i) => i[filterKey]).filter(Boolean))].map(
              (f) => (
                <option key={f}>{f}</option>
              ),
            )}
          </select>
        )}
        <input
          aria-label="From date"
          title="From date"
          type="date"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            setRequestedPage(1);
          }}
        />
        <input
          aria-label="To date"
          title="To date"
          type="date"
          value={end}
          onChange={(e) => {
            setEnd(e.target.value);
            setRequestedPage(1);
          }}
        />
        {onExport && (
          <Button icon="Download" onClick={() => onExport(matches)}>
            Export CSV
          </Button>
        )}
      </div>
      <div className="record-count">
        Showing{" "}
        <b>
          {matches.length ? offset + 1 : 0}–
          {Math.min(offset + pageSize, matches.length)}
        </b>{" "}
        of <b>{matches.length}</b> records
        {matches.length !== items.length && ` (${items.length} total)`}
      </div>
      <Table
        heads={heads}
        empty={
          !matches.length && (
            <Empty
              title={items.length ? "No matching records" : emptyTitle}
              text={
                items.length
                  ? "Try changing your search or filters."
                  : emptyText
              }
            />
          )
        }
      >
        {visible.map(render)}
      </Table>
      <nav className="pagination" aria-label="Table pagination">
        <span>20 records per page</span>
        <div className="pager-controls">
          <Button
            type="button"
            onClick={() => setRequestedPage(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            First
          </Button>
          <Button
            type="button"
            onClick={() => setRequestedPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            Previous
          </Button>
          <span className="page-position" aria-live="polite">
            Page <b>{currentPage}</b> of <b>{totalPages}</b>
          </span>
          <Button
            type="button"
            onClick={() => setRequestedPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </Button>
          <Button
            type="button"
            onClick={() => setRequestedPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            Last
          </Button>
        </div>
      </nav>
    </section>
  );
}
function Trend({ db, period }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const end = period?.to && period.to < today() ? period.to : today();
    const d = new Date(end + "T12:00:00+05:30");
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(d);
    return {
      date,
      label: d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }),
      sale: db.documents
        .filter((x) => !x.void && x.date === date && x.type === "sale")
        .reduce((s, x) => s + x.total, 0),
      purchase: db.documents
        .filter((x) => !x.void && x.date === date && x.type === "purchase")
        .reduce((s, x) => s + x.total, 0),
    };
  });
  const max = Math.max(4, ...days.flatMap((d) => [d.sale, d.purchase]));
  return (
    <div className="trend">
      <div className="y-axis">
        {[4, 3, 2, 1, 0].map((n) => (
          <span key={n}>{money((max * n) / 4).replace(".00", "")}</span>
        ))}
      </div>
      <div className="plot">
        <div className="gridlines">
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} />
          ))}
        </div>
        <div className="bars">
          {days.map((d) => (
            <div
              className="bar-group"
              key={d.date}
              title={`${d.date} · Sales ${money(d.sale)} · Purchases ${money(d.purchase)}`}
            >
              <div className="bar-pair">
                <div
                  className="bar blue-bar"
                  style={{ height: `${(d.sale / max) * 100}%` }}
                />
                <div
                  className="bar rose-bar"
                  style={{ height: `${(d.purchase / max) * 100}%` }}
                />
              </div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
        {!days.some((d) => d.sale || d.purchase) && (
          <div className="chart-empty">
            <Icon name="ChartHistogram" size={26} />
            <span>Your sales story starts here</span>
            <small>Transactions will bring this chart to life</small>
          </div>
        )}
      </div>
    </div>
  );
}
function MasterForm({ type, data, onSave, onCancel, lockPartyType = false }) {
  const [f, setF] = useState(
    data ||
      (type === "item"
        ? {
            name: "",
            category: "General",
            hsn: "",
            barcode: "",
            cost: 0,
            price: 0,
            gst: 0,
            stock: 0,
            min: 0,
            unit: "PCS",
          }
        : {
            name: "",
            type: "Customer",
            phone: "",
            email: "",
            gstin: "",
            state: "09",
            address: "",
            opening: 0,
            creditLimit: 0,
          }),
  );
  const field = (key, label, kind = "text", required = false) => (
    <Input
      key={key}
      label={label}
      type={kind}
      required={required}
      min={
        kind === "number" && !(key === "stock" && f.sourceProductId)
          ? 0
          : undefined
      }
      max={key === "gst" ? 100 : undefined}
      step={kind === "number" ? "any" : undefined}
      value={f[key] ?? ""}
      onChange={(e) =>
        setF({
          ...f,
          [key]: kind === "number" ? e.target.value : e.target.value,
        })
      }
    />
  );
  return (
    <form
      className="modal-body master-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <div className="form-grid">
        {field(
          "name",
          type === "item" ? "Product Name *" : "Party Name *",
          "text",
          true,
        )}
        {type === "item" ? (
          <>
            {field("category", "Category")}
            {field("hsn", "HSN / SAC Code")}
            {field("barcode", "Barcode")}
            {field("sku", "SKU / Product Code")}
            <Select
              label="Unit of Measure"
              value={f.unit}
              onChange={(e) => setF({ ...f, unit: e.target.value })}
            >
              {[
                "PCS",
                "KG",
                "GM",
                "LTR",
                "ML",
                "BOX",
                "PACK",
                "BAG",
                "DOZEN",
                "MTR",
                "SET",
                "TIN",
                "JAR",
                "PKT",
              ].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
            {field("gst", "GST %", "number")}
            {field("cost", "Purchase Price (excl. GST)", "number", true)}
            {field("price", "Sale Price (excl. GST)", "number", true)}
            {field(
              "stock",
              data ? "Current Stock (adjustment)" : "Opening Stock",
              "number",
              true,
            )}
            {field("min", "Minimum / Reorder Level", "number")}
          </>
        ) : (
          <>
            <Select
              label="Party Type"
              disabled={lockPartyType}
              value={f.type}
              onChange={(e) => setF({ ...f, type: e.target.value })}
            >
              <option>Customer</option>
              <option>Supplier</option>
            </Select>
            {field("phone", "Phone / WhatsApp", "tel")}
            {field("email", "Email", "email")}
            {field("gstin", "GSTIN (optional)")}
            <Select
              label="State / Place of Supply"
              value={f.state}
              onChange={(e) => setF({ ...f, state: e.target.value })}
            >
              {STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </Select>
            {field("opening", "Opening Outstanding Balance", "number")}
            {field("creditLimit", "Credit Limit (0 = no limit)", "number")}
            {field("address", "Full Address")}
          </>
        )}
      </div>
      {type === "item" && (
        <p className="small muted">
          Prices exclude GST. Stock changes create an accounting adjustment.
        </p>
      )}
      <div className="form-footer">
        <Button onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button kind="primary" icon="DeviceFloppy" type="submit">
          Save {type === "item" ? "Product" : "Party"}
        </Button>
      </div>
    </form>
  );
}
function PaymentForm({ db, initial, onSave }) {
  const [f, setF] = useState({
    type: initial?.type || "In",
    partyId: "",
    amount: "",
    mode: "Cash",
    date: today(),
    reference: "",
  });
  const p = db.parties.find((p) => p.id === f.partyId);
  return (
    <form
      className="modal-body"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <div className="form-grid">
        <Select
          label="Payment Type"
          value={f.type}
          onChange={(e) => setF({ ...f, type: e.target.value, partyId: "" })}
        >
          <option value="In">Payment In (Customer)</option>
          <option value="Out">Payment Out (Supplier)</option>
        </Select>
        <Select
          label="Party *"
          required
          value={f.partyId}
          onChange={(e) => setF({ ...f, partyId: e.target.value })}
        >
          <option value="">Select a party</option>
          {db.parties
            .filter(
              (p) => p.type === (f.type === "In" ? "Customer" : "Supplier"),
            )
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
        <Input
          label="Amount *"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
        />
        <Select
          label="Payment Mode"
          value={f.mode}
          onChange={(e) => setF({ ...f, mode: e.target.value })}
        >
          {["Cash", "UPI", "Bank", "Card", "Cheque"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          label="Date"
          type="date"
          required
          value={f.date}
          onChange={(e) => setF({ ...f, date: e.target.value })}
        />
        <Input
          label="Reference / Transaction ID"
          value={f.reference}
          onChange={(e) => setF({ ...f, reference: e.target.value })}
        />
      </div>
      {p && (
        <div className="notice">
          Current outstanding: <b>{money(balance(db, p))}</b>
        </div>
      )}
      <div className="form-footer">
        <Button kind="primary" type="submit">
          Record Payment
        </Button>
      </div>
    </form>
  );
}
function ExpenseForm({ onSave }) {
  const [f, setF] = useState({
    title: "",
    category: "Rent",
    vendor: "",
    amount: "",
    gst: 0,
    mode: "Cash",
    date: today(),
  });
  return (
    <form
      className="modal-body"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(f);
      }}
    >
      <div className="form-grid">
        <Input
          label="Expense Title *"
          required
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
        />
        <Select
          label="Category"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        >
          {[
            "Rent",
            "Electricity",
            "Salary",
            "Transport",
            "Office Supplies",
            "Maintenance",
            "Other",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          label="Vendor / Party"
          value={f.vendor}
          onChange={(e) => setF({ ...f, vendor: e.target.value })}
        />
        <Input
          label="Taxable Amount *"
          required
          type="number"
          min="0.01"
          step="0.01"
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
        />
        <Input
          label="GST %"
          type="number"
          min="0"
          max="100"
          step="any"
          value={f.gst}
          onChange={(e) => setF({ ...f, gst: e.target.value })}
        />
        <Select
          label="Payment Mode"
          value={f.mode}
          onChange={(e) => setF({ ...f, mode: e.target.value })}
        >
          {["Cash", "UPI", "Bank", "Card", "Cheque"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          label="Date"
          type="date"
          required
          value={f.date}
          onChange={(e) => setF({ ...f, date: e.target.value })}
        />
      </div>
      <p className="muted small">
        Expense GST is split equally into CGST and SGST for local purchases.
      </p>
      <div className="form-footer">
        <span>
          Total: <b>{money(Number(f.amount) * (1 + Number(f.gst) / 100))}</b>
        </span>
        <Button type="submit" kind="primary">
          Record Expense
        </Button>
      </div>
    </form>
  );
}
function ImportForm({ onImport }) {
  const [text, setText] = useState(""),
    [error, setError] = useState(""),
    [fileName, setFileName] = useState("");
  let count = 0;
  try {
    if (text) count = importItems(fresh(), text).items.length;
  } catch (e) {
    count = 0;
  }
  return (
    <div className="modal-body">
      <p>
        Import products using these exact CSV column names. No data is saved
        until the complete file passes validation.
      </p>
      <code className="csv-columns">
        name,category,hsn,barcode,unit,cost,price,gst,stock,min
      </code>
      <Button
        icon="Download"
        onClick={() =>
          download(
            "inventory-template.csv",
            "name,category,hsn,barcode,unit,cost,price,gst,stock,min\n",
            "text/csv",
          )
        }
      >
        Download Empty Template
      </Button>
      <label className="dropzone">
        <Icon name="FileUpload" size={34} />
        <b>{fileName || "Choose an inventory CSV"}</b>
        <span>UTF-8 CSV · Prices exclude GST</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            const f = e.target.files[0];
            if (!f) return;
            try {
              const t = await f.text();
              importItems(fresh(), t);
              setText(t);
              setFileName(f.name);
              setError("");
            } catch (e) {
              setError(e.message);
              setText("");
            }
          }}
        />
      </label>
      {error && <p className="danger-text">{error}</p>}
      {text && (
        <div className="notice">
          <Icon name="Check" /> {count} products validated and ready to import.
        </div>
      )}
      <p className="small muted">
        Imports add new products. Duplicate barcodes are rejected. Opening stock
        creates accounting entries. For a different export format, share your
        file so its columns can be mapped.
      </p>
      <div className="form-footer">
        <Button kind="primary" disabled={!text} onClick={() => onImport(text)}>
          Import {count || ""} Products
        </Button>
      </div>
    </div>
  );
}
function DocumentEditor({ db, initial, pos, onSave, onBack, onAddSupplier }) {
  const [f, setF] = useState(initial),
    [q, setQ] = useState(""),
    [showProducts, setShowProducts] = useState(false),
    [highlight, setHighlight] = useState(0),
    [fullPaid, setFullPaid] = useState(Boolean(pos) && initial.mode !== "Credit");
  const purchase = f.type === "purchase";
  const credit = f.mode === "Credit";
  const party = db.parties.find((p) => p.id === f.partyId);
  let calc = {
    subtotal: 0,
    billDiscount: 0,
    loadingCharge: 0,
    taxable: 0,
    tax: 0,
    total: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    lines: [],
  };
  let calculationError = "";
  try {
    if (f.lines.length)
      calc = calculate(
        f.lines,
        db.items,
        f.gst,
        (party?.state || db.settings.state) !== db.settings.state,
        f,
      );
  } catch (error) {
    calculationError = error.message;
  }
  const paidAmount = credit ? 0 : fullPaid ? calc.total : Number(f.paid || 0);
  const add = (i) => {
    setF((s) => {
      const existing = s.lines.find((l) => l.itemId === i.id);
      return {
        ...s,
        lines: existing
          ? s.lines.map((l) =>
              l.itemId === i.id ? { ...l, qty: Number(l.qty) + 1 } : l,
            )
          : [
              ...s.lines,
              {
                itemId: i.id,
                qty: 1,
                rate: purchase ? i.cost : i.price,
                discount: 0,
              },
            ],
      };
    });
  };
  const setLine = (index, key, v) =>
    setF({
      ...f,
      lines: f.lines.map((l, j) => (j === index ? { ...l, [key]: v } : l)),
    });
  const submit = (e) => {
    e.preventDefault();
    const result = onSave({ ...f, paid: paidAmount });
    if (result && pos) {
      setF({ ...initial, lines: [], partyId: "", paid: 0, loadingCharge: 0, billDiscount: 0 });
      setFullPaid(Boolean(pos) && initial.mode !== "Credit");
      setQ("");
    }
  };
  const catalog = db.items.filter((i) =>
    `${i.name} ${i.sku || ""} ${i.barcode} ${i.hsn}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const candidates = catalog.slice(0, 14);
  const choose = (i) => {
    if (!i || (!purchase && i.stock <= 0)) return;
    add(i);
    setQ("");
    setShowProducts(false);
    setHighlight(0);
  };
  return (
    <>
      <div className="page-head transaction-heading">
        <div>
          <div className="workspace-kicker">RETAIL / TRANSACTIONS</div>
          <h1>
            {pos
              ? "Express POS"
              : purchase
                ? "New purchase"
                : f.gst
                  ? "New GST invoice"
                  : "New non-GST invoice"}
          </h1>
        </div>
        <div className="actions">
          <span className="transaction-hint">
            Search → Add items → Settle bill
          </span>
          <Button icon="ArrowLeft" onClick={onBack}>
            Back to Register
          </Button>
        </div>
      </div>
      <form className="transaction-form" onSubmit={submit}>
        <section className="product-entry" aria-label="Add products">
          <div className="product-search-box">
            <span className="search-symbol">
              <Icon name="Search" size={24} />
            </span>
            <input
              autoFocus
              role="combobox"
              aria-label="Add Product / Search Item"
              aria-autocomplete="list"
              aria-expanded={showProducts}
              aria-controls="product-matches"
              aria-activedescendant={
                showProducts && candidates[highlight]
                  ? `match-${candidates[highlight].id}`
                  : undefined
              }
              placeholder="Search product name, SKU, HSN or scan a barcode…"
              value={q}
              onFocus={() => setShowProducts(true)}
              onBlur={() => setShowProducts(false)}
              onChange={(e) => {
                setQ(e.target.value);
                setShowProducts(true);
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShowProducts(false);
                }
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setShowProducts(true);
                  setHighlight((v) =>
                    Math.max(
                      0,
                      Math.min(
                        candidates.length - 1,
                        v + (e.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (showProducts || q)
                    choose(
                      db.items.find(
                        (i) =>
                          (i.barcode && i.barcode === q) ||
                          (i.sku && i.sku === q),
                      ) || candidates[highlight],
                    );
                }
              }}
            />
            <kbd>↵ Add</kbd>
            <span className="catalog-count">{db.items.length} products</span>
          </div>
          {showProducts && (
            <div
              className="product-matches"
              id="product-matches"
              role="listbox"
              aria-label="Matching products"
            >
              <div className="match-header">
                <span>PRODUCT / SKU</span>
                <span>AVAILABLE</span>
                <span>RATE</span>
              </div>
              {candidates.map((i, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={highlight === index}
                  id={`match-${i.id}`}
                  key={i.id}
                  disabled={!purchase && i.stock <= 0}
                  className={highlight === index ? "highlighted" : ""}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                >
                  <span>
                    <b>{i.name}</b>
                    <small>{i.sku || i.hsn || i.category}</small>
                  </span>
                  <span className={i.stock <= 0 ? "danger-text" : ""}>
                    {i.stock} {i.unit}
                  </span>
                  <strong>{money(purchase ? i.cost : i.price)}</strong>
                </button>
              ))}
              {!candidates.length && (
                <p className="no-matches">
                  No matching products. Add or import products in Items &
                  Inventory.
                </p>
              )}
            </div>
          )}
        </section>
        <div className="bill-table-heading">
          <span>
            <b>{f.lines.length}</b> line items ·{" "}
            {f.lines.reduce((sum, l) => sum + Number(l.qty || 0), 0)} units
          </span>
          <span>
            Prices exclude GST · Edit quantity, rate, discount or GST directly
          </span>
        </div>
        <section
          className="panel line-items document-main full-width-lines"
          aria-label="Invoice items"
        >
          {" "}
          <Table
            heads={
              pos
                ? ["Item", "Qty", "Rate", "Total", ""]
                : ["Product", "Quantity", "Rate", "Disc %", "GST", "Total", ""]
            }
            empty={
              !f.lines.length && (
                <Empty
                  title="Your cart is empty"
                  text={
                    pos
                      ? "Scan a barcode or select a product from the catalog."
                      : "Search a product above and press Enter to add it."
                  }
                />
              )
            }
          >
            {f.lines.map((l, index) => {
              const i = db.items.find((i) => i.id === l.itemId),
                c = calc.lines[index];
              return (
                <tr key={l.itemId}>
                  <td>
                    <b>{i?.name}</b>
                    <small>
                      {i?.hsn} · {i?.unit}
                    </small>
                  </td>
                  <td>
                    <input
                      aria-label={`${i?.name} quantity`}
                      className="cell-input"
                      type="number"
                      min="0.001"
                      step="any"
                      required
                      value={l.qty}
                      onChange={(e) => setLine(index, "qty", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`${i?.name} rate`}
                      className="cell-input rate"
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={l.rate}
                      onChange={(e) => setLine(index, "rate", e.target.value)}
                    />
                  </td>
                  {!pos && (
                    <>
                      <td>
                        <input
                          aria-label={`${i?.name} discount percent`}
                          className="cell-input"
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={l.discount}
                          onChange={(e) =>
                            setLine(index, "discount", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${i?.name} GST percent`}
                          className="cell-input"
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          required
                          disabled={!f.gst}
                          value={f.gst ? (l.gstRate ?? i?.gst ?? 0) : 0}
                          onChange={(e) =>
                            setLine(index, "gstRate", e.target.value)
                          }
                        />
                      </td>
                    </>
                  )}
                  <td>{money(c?.total)}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn danger-text"
                      title="Remove item"
                      onClick={() =>
                        setF({
                          ...f,
                          lines: f.lines.filter((_, j) => index !== j),
                        })
                      }
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </Table>
        </section>
        <section
          className="billing-dock"
          aria-label="Bill details, totals and payment"
        >
          {" "}
          <section className="billing-customer">
            <h2>
              Bill details{" "}
              <span className="muted small">{f.lines.length} items</span>
            </h2>
            <div className="form-grid document-fields">
              <Select
                label={purchase ? "Supplier *" : "Customer"}
                required={purchase || credit}
                value={f.partyId}
                onChange={(e) => {
                  if (purchase && e.target.value === "__add_supplier__") {
                    onAddSupplier((id) =>
                      setF((current) => ({ ...current, partyId: id })),
                    );
                  } else setF({ ...f, partyId: e.target.value });
                }}
              >
                <option value="">
                  {purchase ? "Select Supplier" : "Walk-in Customer"}
                </option>
                {purchase && (
                  <option value="__add_supplier__">+ Add New Supplier</option>
                )}
                {db.parties
                  .filter(
                    (p) => p.type === (purchase ? "Supplier" : "Customer"),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
              <Input
                label="Invoice Date"
                type="date"
                required
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
              {purchase && (
                <Input
                  label="Supplier Bill Reference"
                  value={f.reference || ""}
                  onChange={(e) => setF({ ...f, reference: e.target.value })}
                />
              )}
              <Select
                label="Tax Type"
                value={String(f.gst)}
                onChange={(e) => setF({ ...f, gst: e.target.value === "true" })}
              >
                <option value="true">GST Invoice</option>
                <option value="false">Non-GST Invoice</option>
              </Select>
            </div>
            <Input
              label="Notes / Terms"
              value={f.notes || ""}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
            />
            <div className="bill-adjustments">
              <Input
                label="Loading Charge (₹)"
                type="number"
                min="0"
                step="0.01"
                value={f.loadingCharge ?? 0}
                onChange={(e) => setF({ ...f, loadingCharge: e.target.value })}
              />
              <Input
                label="Bill Discount (₹)"
                type="number"
                min="0"
                step="0.01"
                value={f.billDiscount ?? 0}
                onChange={(e) => setF({ ...f, billDiscount: e.target.value })}
              />
            </div>
            <p className="small muted">Loading charge and bill discount apply before GST, in addition to item discounts.</p>
          </section>
          <section className="billing-payment">
            <h2>Payment & balance</h2>{" "}
            <Select
              label="Payment Mode"
              value={f.mode}
              onChange={(e) => {
                const mode = e.target.value;
                setF({ ...f, mode, paid: mode === "Credit" ? 0 : f.paid });
                if (mode === "Credit") setFullPaid(false);
                else if (credit) setFullPaid(Boolean(pos));
              }}
            >
              {["Cash", "UPI", "Card", "Bank", "Cheque", "Credit"].map((m) => (
                <option key={m} value={m}>{m === "Credit" ? "Credit / Udhaar" : m}</option>
              ))}
            </Select>
            {credit && <p className="small muted">{purchase ? "Select a supplier. The full bill remains payable; record payment later in Payment In & Out." : "Select a customer for udhaar. Nothing is received now; collect later in Payment In & Out."}</p>}
            {!credit && <label className="check">
              <input
                type="checkbox"
                checked={fullPaid}
                onChange={(e) => setFullPaid(e.target.checked)}
              />{" "}
              {purchase ? "Paid in full" : "Received full amount"}
            </label>}
            {!credit && !fullPaid && (
              <Input
                label={purchase ? "Amount Paid" : "Amount Received"}
                type="number"
                min="0"
                max={calc.total}
                step="0.01"
                value={f.paid}
                onChange={(e) => setF({ ...f, paid: e.target.value })}
              />
            )}
            <div className="summary-row">
              <span>Balance due</span>
              <b className="amber-text">
                {money(calc.total - paidAmount)}
              </b>
            </div>
            {party && (
              <p className="small muted">
                Existing party balance: {money(balance(db, party))}
              </p>
            )}
          </section>
          <section className="billing-totals">
            {calculationError && <p role="alert" className="danger-text">{calculationError}</p>}
            <div className="tax-breakdown">
              {" "}
              {(calc.loadingCharge > 0 || calc.billDiscount > 0) && <>
                <div className="summary-row"><span>Item subtotal</span><b>{money(calc.subtotal)}</b></div>
                <div className="summary-row"><span>Bill discount</span><b>−{money(calc.billDiscount)}</b></div>
                <div className="summary-row"><span>Loading charge</span><b>{money(calc.loadingCharge)}</b></div>
              </>}
              <div className="summary-row">
                <span>Taxable value</span>
                <b>{money(calc.taxable)}</b>
              </div>
              {calc.igst > 0 ? (
                <div className="summary-row">
                  <span>IGST</span>
                  <b>{money(calc.igst)}</b>
                </div>
              ) : (
                <>
                  <div className="summary-row">
                    <span>CGST</span>
                    <b>{money(calc.cgst)}</b>
                  </div>
                  <div className="summary-row">
                    <span>SGST</span>
                    <b>{money(calc.sgst)}</b>
                  </div>
                </>
              )}
            </div>{" "}
            <div className="total-row">
              <span>TOTAL PAYABLE</span>
              <strong>{money(calc.total)}</strong>
            </div>
            <Button
              type="submit"
              kind="primary full"
              icon={pos ? "Receipt" : "DeviceFloppy"}
              disabled={!f.lines.length || Boolean(calculationError) || (credit && !party)}
            >
              {pos
                ? "Save & View Receipt"
                : purchase
                  ? "Save Purchase Bill"
                  : "Save Invoice"}
            </Button>
            <div className="save-hint">
              <Icon name="ShieldCheck" size={16} /> Saved locally on this device
            </div>
          </section>
        </section>
      </form>
    </>
  );
}

function Reports({ db, period, page, Head, onExport }) {
  const [tab, setTab] = useState(
      page === "gst" ? "GSTR-1 Outward" : "Trial Balance",
    ),
    [start, setStart] = useState(period.from || ""),
    [end, setEnd] = useState(period.to || "");
  const filtered = {
    ...db,
    documents: db.documents.filter(
      (d) => (!start || d.date >= start) && (!end || d.date <= end),
    ),
    payments: db.payments.filter(
      (d) => (!start || d.date >= start) && (!end || d.date <= end),
    ),
    expenses: db.expenses.filter(
      (d) => (!start || d.date >= start) && (!end || d.date <= end),
    ),
    journals: db.journals.filter(
      (d) => (!start || d.date >= start) && (!end || d.date <= end),
    ),
  };
  const m = metrics(filtered),
    sales = filtered.documents.filter(
      (d) => !d.void && d.type === "sale" && d.gst,
    ),
    accounts = ledger(filtered),
    debit = round(accounts.reduce((s, a) => s + a.debit, 0)),
    credit = round(accounts.reduce((s, a) => s + a.credit, 0));
  if (page === "profit")
    return (
      <>
        <Head
          title="Profit & Loss"
          sub="Revenue, cost of goods sold, and operating expenses from your accounting entries."
        />
        <div className="report-period">
          <Input
            label="From"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="stats">
          <Stat label="NET SALES (EXCL. GST)" value={money(m.revenue)} />
          <Stat
            label="COST OF GOODS SOLD"
            value={money(m.cogs)}
            color="amber"
          />
          <Stat
            label="NET PROFIT / LOSS"
            value={money(m.profit)}
            color={m.profit >= 0 ? "green" : "rose"}
          />
        </div>
        <section className="panel profit-statement">
          <h2>Profit & Loss Statement</h2>
          {[
            ["Sales revenue", m.revenue],
            ["Less: cost of goods sold", -m.cogs],
            ["Gross profit", m.revenue - m.cogs],
            ["Less: operating expenses", -m.expenses],
            ["Net profit / loss", m.profit],
          ].map(([l, v], i) => (
            <div
              className={
                i === 2 || i === 4 ? "statement-row subtotal" : "statement-row"
              }
              key={l}
            >
              <span>{l}</span>
              <strong className={v < 0 ? "danger-text" : ""}>{money(v)}</strong>
            </div>
          ))}
          <p className="muted small">
            GST is excluded from revenue and costs. Inventory uses weighted
            average purchase cost.
          </p>
          <Button
            icon="Download"
            onClick={() =>
              onExport("profit-loss.csv", [
                {
                  revenue: m.revenue,
                  costOfGoods: m.cogs,
                  grossProfit: m.revenue - m.cogs,
                  expenses: m.expenses,
                  netProfit: m.profit,
                },
              ])
            }
          >
            Export Statement
          </Button>
        </section>
      </>
    );
  if (page === "gst") {
    const hsn = {};
    sales.forEach((d) =>
      d.lines.forEach((l) => {
        const k = `${l.hsn || "Unspecified"}-${l.gstRate}`;
        hsn[k] ??= {
          hsn: l.hsn || "Unspecified",
          rate: l.gstRate,
          quantity: 0,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
        };
        for (const key of ["taxable", "cgst", "sgst", "igst"])
          hsn[k][key] = round(hsn[k][key] + l[key]);
        hsn[k].quantity += l.qty;
      }),
    );
    return (
      <>
        <Head
          title="GST Compliance & Filing Center"
          sub="GSTR-1 outward supplies, GSTR-3B summary, and HSN/SAC worksheets."
        >
          <Button
            icon="Download"
            onClick={() =>
              download(
                `gst-working-${today()}.json`,
                JSON.stringify(
                  {
                    gstin: db.settings.gstin,
                    from: start,
                    to: end,
                    outward: sales,
                    hsn: Object.values(hsn),
                    output: m.output,
                    input: m.input,
                    net: round(m.output - m.input),
                  },
                  null,
                  2,
                ),
              )
            }
          >
            Export Working JSON
          </Button>
        </Head>
        <div className="notice">
          <Icon name="InfoCircle" />
          These are accounting worksheets for review, rather than a government
          portal upload file.
        </div>
        <div className="report-period">
          <Input
            label="From"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="stats">
          <Stat
            label="TOTAL OUTPUT TAX"
            value={money(m.output)}
            note={`From ${sales.length} GST sales invoices`}
          />
          <Stat
            label="INPUT TAX RECORDED"
            value={money(m.input)}
            color="green"
            note="Purchases and local expenses; review eligibility"
          />
          <Stat
            label="NET GST PAYABLE"
            value={money(Math.max(0, m.output - m.input))}
            color="amber"
            note={
              m.input > m.output
                ? `Excess recorded credit: ${money(m.input - m.output)}`
                : "After recorded input tax adjustment"
            }
          />
        </div>
        <section className="panel report-panel">
          <div className="tabs padded-tabs">
            {["GSTR-1 Outward", "GSTR-3B Summary", "HSN/SAC Summary"].map(
              (t) => (
                <button
                  className={tab === t ? "selected" : ""}
                  onClick={() => setTab(t)}
                  key={t}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "GSTR-1 Outward" ? (
            <Records
              key={`${page}-${period.from}-${period.to}`}
              items={sales}
              heads={[
                "Invoice No",
                "Date",
                "Customer GSTIN",
                "Customer",
                "POS",
                "Taxable",
                "CGST",
                "SGST",
                "IGST",
                "Value",
              ]}
              onExport={(r) =>
                onExport(
                  "gstr1-worksheet.csv",
                  r.map((d) => ({
                    invoice: d.number,
                    date: d.date,
                    gstin: d.partyGstin,
                    customer: d.partyName,
                    state: d.partyState,
                    taxable: d.taxable,
                    cgst: d.cgst,
                    sgst: d.sgst,
                    igst: d.igst,
                    total: d.total,
                  })),
                )
              }
              render={(d) => (
                <tr key={d.id}>
                  <td>{d.number}</td>
                  <td>{d.date}</td>
                  <td>{d.partyGstin || "B2C"}</td>
                  <td>{d.partyName}</td>
                  <td>{d.partyState}</td>
                  <td>{money(d.taxable)}</td>
                  <td>{money(d.cgst)}</td>
                  <td>{money(d.sgst)}</td>
                  <td>{money(d.igst)}</td>
                  <td>{money(d.total)}</td>
                </tr>
              )}
            />
          ) : tab === "HSN/SAC Summary" ? (
            <Records
              key={`${page}-${period.from}-${period.to}`}
              items={Object.values(hsn)}
              heads={[
                "HSN",
                "Rate",
                "Quantity",
                "Taxable",
                "CGST",
                "SGST",
                "IGST",
              ]}
              onExport={(r) => onExport("hsn-worksheet.csv", r)}
              render={(h) => (
                <tr key={h.hsn + "-" + h.rate}>
                  <td>{h.hsn}</td>
                  <td>{h.rate}%</td>
                  <td>{h.quantity}</td>
                  <td>{money(h.taxable)}</td>
                  <td>{money(h.cgst)}</td>
                  <td>{money(h.sgst)}</td>
                  <td>{money(h.igst)}</td>
                </tr>
              )}
            />
          ) : (
            <div className="padded">
              <Table heads={["Description", "Amount"]}>
                <tr>
                  <td>Taxable outward supplies</td>
                  <td>{money(sales.reduce((s, d) => s + d.taxable, 0))}</td>
                </tr>
                <tr>
                  <td>Output GST</td>
                  <td>{money(m.output)}</td>
                </tr>
                <tr>
                  <td>Input GST recorded</td>
                  <td>{money(m.input)}</td>
                </tr>
                <tr>
                  <td>Net tax liability before eligibility review</td>
                  <td>{money(Math.max(0, m.output - m.input))}</td>
                </tr>
              </Table>
            </div>
          )}
        </section>
      </>
    );
  }
  return (
    <>
      <Head
        title="Double-Entry Accounting"
        sub="Automatically balanced journals, chart of accounts, and trial balance."
      />
      <div className="report-period">
        <Input
          label="From"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div className="stats">
        <Stat label="TOTAL DEBITS" value={money(debit)} />
        <Stat label="TOTAL CREDITS" value={money(credit)} color="green" />
        <Stat
          label="BALANCE CHECK"
          value={
            Math.abs(debit - credit) < 0.02 ? "Balanced" : money(debit - credit)
          }
          color="purple"
          icon="Scale"
        />
      </div>
      <section className="panel report-panel">
        <div className="tabs padded-tabs">
          {["Trial Balance", "Journal Entries"].map((t) => (
            <button
              key={t}
              className={tab === t ? "selected" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Trial Balance" ? (
          <Records
            key={`${page}-${period.from}-${period.to}`}
            items={accounts}
            heads={[
              "Account",
              "Debit Turnover",
              "Credit Turnover",
              "Net Period Debit",
              "Net Period Credit",
            ]}
            onExport={(r) => onExport("trial-balance.csv", r)}
            render={(a) => (
              <tr key={a.account}>
                <td>{a.account}</td>
                <td>{money(a.debit)}</td>
                <td>{money(a.credit)}</td>
                <td>{money(Math.max(0, a.debit - a.credit))}</td>
                <td>{money(Math.max(0, a.credit - a.debit))}</td>
              </tr>
            )}
          />
        ) : (
          <Records
            key={`${page}-${period.from}-${period.to}`}
            items={filtered.journals.flatMap((j) =>
              j.entries.map((e, i) => ({
                ...e,
                id: j.id + "-" + i,
                date: j.date,
                description: j.description,
              })),
            )}
            heads={["Date", "Description", "Account", "Debit", "Credit"]}
            onExport={(r) => onExport("journals.csv", r)}
            render={(e) => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.description}</td>
                <td>{e.account}</td>
                <td>{e.debit ? money(e.debit) : "—"}</td>
                <td>{e.credit ? money(e.credit) : "—"}</td>
              </tr>
            )}
          />
        )}
      </section>
    </>
  );
}
function Settings({ db, onSave }) {
  const [s, setS] = useState(db.settings);
  const input = (k, label, type = "text") => (
    <Input
      key={k}
      label={label}
      type={type}
      value={s[k] ?? ""}
      onChange={(e) =>
        setS({
          ...s,
          [k]: type === "number" ? Number(e.target.value) : e.target.value,
        })
      }
    />
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(s);
      }}
    >
      <section className="panel settings-section">
        <div className="settings-label">
          <Icon name="BuildingStore" size={26} />
          <h2>General Business Profile</h2>
          <p>Your business identity appears on invoices and reports.</p>
        </div>
        <div className="form-grid">
          <Input
            label="Business Trade Name *"
            required
            value={s.name}
            onChange={(e) => setS({ ...s, name: e.target.value })}
          />
          {input("owner", "Owner / Operator Name")}
          {input("legalName", "Legal Registered Name")}
          <Select
            label="Business Category"
            value={s.category}
            onChange={(e) => setS({ ...s, category: e.target.value })}
          >
            {[
              "Retail Store / Kirana",
              "Wholesaler / Trader",
              "Distributor / Agency",
              "Manufacturing / Production",
              "Pharmacy / Medical Store",
              "Services / Consulting",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
          <Input
            label="GSTIN Number"
            pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
            title="15-character GSTIN"
            value={s.gstin}
            onChange={(e) =>
              setS({ ...s, gstin: e.target.value.toUpperCase() })
            }
          />
          {input("pan", "PAN Number")}
          <Select
            label="State & State Code"
            value={s.state}
            onChange={(e) => setS({ ...s, state: e.target.value })}
          >
            {STATES.map(([c, n]) => (
              <option key={c} value={c}>
                {c} - {n}
              </option>
            ))}
          </Select>
          {input("phone", "Phone / WhatsApp", "tel")}
          {input("address", "Full Shop / Office Address")}
          {input("email", "Email Address", "email")}
          {input("openingCash", "Opening Cash / Bank Balance", "number")}
        </div>
      </section>
      <section className="panel settings-section">
        <div className="settings-label">
          <Icon name="BuildingBank" size={26} />
          <h2>Bank & UPI Details</h2>
          <p>Payment details printed on your invoices.</p>
        </div>
        <div className="form-grid">
          {input("upi", "UPI ID (VPA)")}
          {input("bank", "Bank Name")}
          {input("account", "Account Number")}
          {input("ifsc", "IFSC Code")}
          {input("branch", "Branch Name")}
        </div>
      </section>
      <section className="panel settings-section">
        <div className="settings-label">
          <Icon name="Printer" size={26} />
          <h2>Invoice Customization</h2>
          <p>Choose your numbering series and print format.</p>
        </div>
        <div className="form-grid">
          {input("prefix", "Invoice Prefix Series")}
          <Select
            label="Default Print Format"
            value={s.printFormat}
            onChange={(e) => setS({ ...s, printFormat: e.target.value })}
          >
            <option value="A4">A4 Standard Sheet</option>
            <option value="80mm">80mm Thermal Receipt</option>
            <option value="58mm">58mm Compact Receipt</option>
          </Select>
          <Field label="Default Terms & Conditions">
            <textarea
              rows="3"
              value={s.terms}
              onChange={(e) => setS({ ...s, terms: e.target.value })}
            />
          </Field>
        </div>
      </section>
      <div className="form-footer">
        <Button kind="primary" icon="DeviceFloppy" type="submit">
          Save Settings
        </Button>
      </div>
    </form>
  );
}
function Invoice({ doc: d, settings: s, db }) {
  const party = db.parties.find((p) => p.id === d.partyId);
  const summary = invoiceSummary(db, d);
  const number = (value) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const title = d.type === "purchase" ? "PURCHASE BILL" : d.gst ? "TAX INVOICE" : "INVOICE";
  return (
    <>
      <style media="print">{`@page { size: ${s.printFormat === "A4" ? "A4" : "auto"}; margin: ${s.printFormat === "A4" ? "10mm" : "3mm"}; }`}</style>
      <div className="invoice-actions">
        <Badge color={d.void ? "rose" : "blue"}>{d.void ? "CANCELLED" : title}</Badge>
        <Button icon="Printer" kind="primary" onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <article className={`print-invoice reference-invoice format-${s.printFormat}`}>
        <header className="reference-brand">
          <h2>{s.name}</h2>
          {s.address && <p>{s.address}</p>}
          {(s.gstin || s.phone) && <p>{[s.gstin && `GSTIN: ${s.gstin}`, s.phone && `Contact: ${s.phone}`].filter(Boolean).join(" · ")}</p>}
        </header>
        <div className="reference-top">
          <section className="reference-customer">
            <b>{d.type === "purchase" ? "Supplier" : "Bill To"}</b>
            <h3>{d.partyName}</h3>
            {(d.partyAddress ?? party?.address) && <p>{d.partyAddress ?? party?.address}</p>}
            {(d.partyPhone ?? party?.phone) && <p>Contact No. : <b>{d.partyPhone ?? party?.phone}</b></p>}
            <p>State: <b>{stateName(d.partyState)}</b></p>
            {d.partyGstin && <p>GSTIN: {d.partyGstin}</p>}
          </section>
          <h2 className="reference-title">{d.void ? "CANCELLED" : title}</h2>
          <section className="reference-details">
            <small>INVOICE NUMBER</small><strong>{d.number}</strong>
            <small>INVOICE DATE</small><b>{date}</b>
            <small>PAYMENT MODE</small><b className="reference-mode">{d.mode === "Credit" ? "Credit / Udhaar" : d.mode}</b>
            <small>INVOICE STATUS</small><b className={`reference-status status-${summary.status.toLowerCase().replaceAll(" ", "-")}`}>{summary.status}</b>
            {d.reference && <p>Reference: {d.reference}</p>}
          </section>
        </div>
        <div className="reference-items">
          <table aria-label="Invoice items">
            <thead><tr>{["#", "Item name", "Quantity", "Unit", "Price/ Unit", "Amount"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{d.lines.map((l, i) => <tr key={i}>
              <td>{i + 1}</td><td><b>{l.name}</b>{d.gst && <small>HSN: {l.hsn || "—"} · GST {l.gstRate}%</small>}{l.discount > 0 && <small>Discount: {l.discount}%</small>}</td>
              <td><b>{l.qty}</b></td><td>{l.unit}</td><td>{number(l.rate)}</td><td><b>{number(l.itemTaxable ?? l.taxable)}</b></td>
            </tr>)}</tbody>
            <tfoot><tr><td colSpan="2">Total</td><td>{round(d.lines.reduce((sum, l) => sum + Number(l.qty), 0))}</td><td colSpan="2"></td><td>{money(d.subtotal ?? d.taxable)}</td></tr></tfoot>
          </table>
        </div>
        <div className="reference-summary">
          <div className="reference-notes">
            <div><b>TOTAL BALANCE <strong className="reference-balance">{money(summary.totalBalance)}</strong></b><small>(Previous Due: {money(summary.previousDue)} + Current Bill Due: {money(summary.due)})</small><small>Balances reflect current payment allocations.</small></div>
            <div className="reference-words"><small>AMOUNT IN WORDS:</small><b><i>{amountInWords(d.total)}</i></b></div>
            {(s.bank || s.upi) && <div className="reference-payment"><b>Payment Details</b><p>{[s.bank, s.account && `A/C ${s.account}`, s.ifsc && `IFSC ${s.ifsc}`, s.branch].filter(Boolean).join(" · ")}</p>{s.upi && <p>UPI: {s.upi}</p>}</div>}
            <div className="reference-terms"><h3>Terms and Conditions</h3><p>{d.notes || s.terms}</p></div>
          </div>
          <div className="reference-totals">
            <div><span>Sub Total</span><b>{money(d.subtotal ?? d.taxable)}</b></div>
            {d.billDiscount > 0 && <div className="invoice-discount"><span>Discount</span><b>−{money(d.billDiscount)}</b></div>}
            {d.loadingCharge > 0 && <div className="invoice-loading"><span>LOADING CHARGE:</span><b>{money(d.loadingCharge)}</b></div>}
            {d.gst && [["CGST", d.cgst], ["SGST", d.sgst], ["IGST", d.igst]].filter(([, value]) => value > 0).map(([label, value]) => <div key={label}><span>{label}</span><b>{money(value)}</b></div>)}
            <div className="reference-grand"><span>Total</span><b>{money(d.total)}</b></div>
            <div><span>Received</span><span>{money(summary.received)}</span></div>
            <div><span>Previous Due</span><span>{money(summary.previousDue)}</span></div>
            <div className="reference-balance"><b>Total Balance</b><b>{money(summary.totalBalance)}</b></div>
          </div>
        </div>
        <footer className="reference-signatures">
          <div><p>Customer's Signature</p><b>Receiver's Signature</b></div>
          <div><strong>For {s.name}</strong><b>Authorized Signatory</b></div>
        </footer>
      </article>
    </>
  );
}
function PartyHistory({ party: p, db, onInvoice }) {
  const docs = db.documents.filter((d) => d.partyId === p.id);
  const payments = db.payments.filter((x) => x.partyId === p.id);
  const events = [
    ...docs.map((d) => ({
      id: d.id,
      date: d.date,
      number: d.number,
      description: d.void
        ? "Cancelled invoice"
        : d.type === "sale"
          ? "Sale invoice"
          : "Purchase bill",
      debit: d.void ? 0 : d.total,
      credit: d.void ? 0 : d.paid,
      doc: d,
    })),
    ...payments.map((x) => ({
      id: x.id,
      date: x.date,
      number: x.number,
      description: x.void
        ? `Cancelled payment · ${x.number}`
        : `Payment ${x.type} · ${x.mode}`,
      debit: 0,
      credit: x.void ? 0 : x.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="modal-body">
      <div className="row between">
        <div>
          <h2>{p.name}</h2>
          <p>
            {p.phone} · {p.type}
          </p>
        </div>
        <Stat
          label="CURRENT OUTSTANDING"
          value={money(balance(db, p))}
          color="green"
        />
      </div>
      <p>
        Opening outstanding: <b>{money(p.opening)}</b>
      </p>
      <Table
        heads={["Date", "Reference", "Description", "Billed", "Paid"]}
        empty={!events.length && <Empty title="No transactions yet" />}
      >
        {events.map((e) => (
          <tr key={e.id}>
            <td>{e.date}</td>
            <td>
              {e.doc ? (
                <button className="text-btn" onClick={() => onInvoice(e.doc)}>
                  {e.number}
                </button>
              ) : (
                e.number
              )}
            </td>
            <td>{e.description}</td>
            <td>{money(e.debit)}</td>
            <td>{money(e.credit)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
function ResetForm({ onReset }) {
  const [value, setValue] = useState("");
  return (
    <div className="modal-body">
      <p>
        This removes products, parties, transactions, and accounting records.
        Your business settings and operators are kept. A backup downloads before
        reset.
      </p>
      <Input
        label="Type RESET to continue"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="form-footer">
        <Button kind="danger" disabled={value !== "RESET"} onClick={onReset}>
          Reset Workspace
        </Button>
      </div>
    </div>
  );
}
function UserForm({ onSave }) {
  const [f, setF] = useState({ name: "", role: "Staff" });
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="modal-body"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          if (password !== confirm) throw Error("Passwords do not match.");
          const credentials = await hashPassword(password);
          await onSave({ ...f, name: f.name.trim(), credentials });
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        label="Operator Name"
        required
        pattern=".*\S.*"
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
      />
      <Select
        label="Role"
        value={f.role}
        onChange={(e) => setF({ ...f, role: e.target.value })}
      >
        <option>Staff</option>
        <option>Admin</option>
      </Select>
      <Input
        label="Initial Password"
        type="password"
        minLength={8}
        maxLength={128}
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Confirm Password"
        type="password"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && (
        <p role="alert" className="danger-text">
          {error}
        </p>
      )}
      <div className="form-footer">
        <Button kind="primary" type="submit" disabled={busy}>
          Add Operator
        </Button>
      </div>
    </form>
  );
}
function LoginScreen({ db, selectedId, onUnlock }) {
  const setup = !db.users.some((u) => u.credentials);
  const owner = db.users.find((u) => u.role === "Admin");
  const [id, setId] = useState(
      setup
        ? owner.id
        : db.users.some((u) => u.id === selectedId)
          ? selectedId
          : owner.id,
    ),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false),
    [recoveryInput, setRecoveryInput] = useState(""),
    [pending, setPending] = useState(null);
  const operator = db.users.find((u) => u.id === id);
  if (pending)
    return (
      <div className="login-shell">
        <section className="login-card">
          <div className="brand-mark">R</div>
          <h1>Save your recovery code</h1>
          <p>
            This code can reset {pending.user.name}'s password offline. Save it
            privately; it is shown once. A new code replaces any previous code.
          </p>
          <code className="recovery-code" data-testid="recovery-code">
            {pending.code}
          </code>
          <Button
            onClick={() =>
              download(
                "retail-erp-recovery-code.txt",
                `${db.settings.name}\nOperator: ${pending.user.name}\nRecovery code: ${pending.code}\nKeep this code private. It can reset your password.\n`,
                "text/plain",
              )
            }
          >
            Download Recovery Code
          </Button>
          <Button
            kind="primary full"
            onClick={() => {
              try {
                onUnlock(pending.user, pending.db);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Continue to Workspace
          </Button>
          {error && (
            <p role="alert" className="danger-text">
              {error}
            </p>
          )}
        </section>
      </div>
    );
  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="brand-mark">R</div>
        <div className="workspace-kicker">RETAIL ERP · DESKTOP</div>
        <h1>
          {setup
            ? "Secure your workspace"
            : recovery
              ? "Recover your account"
              : "Welcome back"}
        </h1>
        <p>{db.settings.name}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
              if (setup) {
                if (password !== confirm)
                  throw Error("Passwords do not match.");
                const credentials = await hashPassword(password);
                const code = createRecoveryCode();
                const recoveryCredentials = await hashPassword(code);
                const u = { ...owner, credentials, recoveryCredentials };
                setPending({
                  user: u,
                  code,
                  db: {
                    ...db,
                    users: db.users.map((x) => (x.id === u.id ? u : x)),
                  },
                });
              } else if (recovery) {
                if (password !== confirm)
                  throw Error("Passwords do not match.");
                const result = await recoverPassword(
                  db,
                  id,
                  recoveryInput,
                  password,
                );
                setPending({
                  user: result.user,
                  db: result.db,
                  code: result.recoveryCode,
                });
              } else {
                if (!operator.credentials)
                  throw Error("Ask an administrator to set your password.");
                if (!(await verifyPassword(password, operator.credentials)))
                  throw Error("Password is incorrect.");
                onUnlock(operator);
              }
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Select
            label="Operator"
            value={id}
            disabled={setup || busy}
            onChange={(e) => {
              setId(e.target.value);
              setPassword("");
              setError("");
              setRecovery(false);
              setRecoveryInput("");
            }}
          >
            {db.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
              </option>
            ))}
          </Select>
          {recovery && (
            <Input
              label="Recovery Code"
              required
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
              autoComplete="off"
            />
          )}
          <Input
            label={setup || recovery ? "New Password" : "Password"}
            type="password"
            visibilityKey={id}
            required
            minLength={setup || recovery ? 8 : undefined}
            maxLength={128}
            autoComplete={
              setup || recovery ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {(setup || recovery) && (
            <>
              <Input
                label="Confirm Password"
                type="password"
                visibilityKey={id}
                required
                maxLength={128}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <p className="small muted">
                Choose at least 8 characters. Your saved products and business
                records will stay in place.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="danger-text">
              {error}
            </p>
          )}
          <Button type="submit" kind="primary full" disabled={busy}>
            {busy
              ? "Please wait…"
              : setup
                ? "Set Password & Continue"
                : recovery
                  ? "Reset Password"
                  : "Sign In"}
          </Button>
        </form>
        {!setup && (
          <Button
            kind="ghost full"
            type="button"
            disabled={!operator.recoveryCredentials}
            onClick={() => {
              setRecovery(!recovery);
              setPassword("");
              setConfirm("");
              setRecoveryInput("");
              setError("");
            }}
          >
            {recovery
              ? "Back to Sign In"
              : operator.recoveryCredentials
                ? "Forgot Password?"
                : "Forgot password? Ask your administrator"}
          </Button>
        )}
        <div className="login-foot">
          Retail ERP v{APP_VERSION} · Data saved on this computer
        </div>
      </section>
    </div>
  );
}
function PasswordForm({ onSave, resetName }) {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="modal-body password-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        if (next !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        setBusy(true);
        try {
          await onSave(current, next);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {resetName && (
        <p>
          Set a new password for <b>{resetName}</b>. Enter your administrator
          password to confirm.
        </p>
      )}
      <Input
        label={resetName ? "Your Administrator Password" : "Current Password"}
        type="password"
        required
        maxLength={128}
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        label="New Password"
        type="password"
        minLength={8}
        maxLength={128}
        required
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Input
        label="Confirm New Password"
        type="password"
        required
        maxLength={128}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && (
        <p role="alert" className="danger-text">
          {error}
        </p>
      )}
      <div className="form-footer">
        <Button kind="primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : resetName ? "Reset Password" : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
function PeriodForm({ db, current, onApply }) {
  const [p, setP] = useState(current),
    [error, setError] = useState("");
  const currentYear = Number(financialYear().slice(0, 4));
  const years = [
    ...new Set([
      currentYear - 3,
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2,
      ...db.documents.map((d) => Number(financialYear(d.date).slice(0, 4))),
      ...db.journals.map((d) => Number(financialYear(d.date).slice(0, 4))),
    ]),
  ].sort((a, b) => b - a);
  const preset = (name) => {
    setP(periodPreset(name, p.year));
    setError("");
  };
  return (
    <form
      className="modal-body"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validPeriod(p)) {
          setError(
            "Choose a valid date range within the selected financial year, or select All years.",
          );
          return;
        }
        onApply(p);
      }}
    >
      <p>
        Apply a reporting period to sales, purchases, payments, expenses,
        dashboard activity, and accounting/GST reports. Stock and party balances
        remain current.
      </p>
      <Select
        label="Financial Year"
        value={p.year}
        onChange={(e) => {
          setP(
            e.target.value === "all"
              ? periodPreset("all")
              : yearRange(e.target.value),
          );
          setError("");
        }}
      >
        <option value="all">All years</option>
        {years.map((y) => {
          const label = `${y}-${String(y + 1).slice(2)}`;
          return (
            <option key={label} value={label}>
              {label} (1 Apr – 31 Mar)
            </option>
          );
        })}
      </Select>
      <div className="period-presets">
        {[
          ["year", "Full Financial Year"],
          ["today", "Today"],
          ["month", "This Month"],
          ["all", "All Dates"],
        ].map(([id, label]) => (
          <Button key={id} type="button" onClick={() => preset(id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="form-grid">
        <Input
          label="From Date"
          type="date"
          value={p.from || ""}
          onChange={(e) => setP({ ...p, from: e.target.value })}
        />
        <Input
          label="To Date"
          type="date"
          value={p.to || ""}
          onChange={(e) => setP({ ...p, to: e.target.value })}
        />
      </div>
      {error && (
        <p role="alert" className="danger-text">
          {error}
        </p>
      )}
      <div className="form-footer">
        <Button type="submit" kind="primary">
          Apply Period
        </Button>
      </div>
    </form>
  );
}

function LicenceSettings() {
  const [status, setStatus] = useState(null),
    [key, setKey] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    window.retailDesktop
      .licenceStatus()
      .then(setStatus)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="panel licence-settings">
      <div className="licence-details">
        <div className="feature-icon green">
          <Icon name="ShieldCheck" size={28} />
        </div>
        <h2>{status?.shop || "Retail ERP annual licence"}</h2>
        <p>{status?.message || "Checking licence…"}</p>
        <div className="licence-facts">
          {[
            ["Status", status?.state],
            ["Licence number", status?.id],
            ["Machine ID", status?.machineId],
            ["Valid from", status?.starts],
            ["Renew before", status?.expires],
            ["Days remaining", status?.daysLeft],
          ].map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <b>{value ?? "—"}</b>
            </div>
          ))}
        </div>
        {status?.nextLicence && (
          <div className="notice">
            Renewal is already activated for {status.nextLicence.starts} to{" "}
            {status.nextLicence.expires}.
          </div>
        )}
        <p className="small muted">
          Ask your software provider for a new signed key each year. Renewing
          early preserves the remainder of the current year. Records are kept
          when a licence expires.
        </p>
      </div>
      <form
        className="licence-renew"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const result = await window.retailDesktop.activateLicence(key);
            setStatus(result);
            setKey("");
            setMessage(
              result.nextLicence
                ? "Your next annual renewal is activated."
                : "Licence activated.",
            );
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Activate annual renewal</h2>
        <p>
          Copy the Machine ID and share it with your provider. Paste the
          complete key they give you.
        </p>
        <Input
          label="Machine ID"
          readOnly
          value={status?.machineId || ""}
          onFocus={(e) => e.target.select()}
        />
        <Field label="Licence / renewal key">
          <textarea
            required
            spellCheck={false}
            rows={6}
            value={key}
            placeholder="RETAIL1-…"
            onChange={(e) => setKey(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="danger-text">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="green-text">
            {message}
          </p>
        )}
        <Button type="submit" kind="primary" disabled={busy || !key.trim()}>
          {busy ? "Checking…" : "Activate Renewal"}
        </Button>
      </form>
    </section>
  );
}
function LicenceNotice({ onRenew }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    const check = () =>
      window.retailDesktop
        .licenceStatus()
        .then(setS)
        .catch(() => {});
    check();
    const interval = setInterval(check, 60000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", check);
    };
  }, []);
  if (!s || s.state !== "active" || s.daysLeft > 30 || s.nextLicence)
    return null;
  return (
    <div className="licence-notice">
      <span>
        <b>Annual licence: {s.daysLeft} days remaining.</b> Renew before{" "}
        {s.expires} to keep using Retail ERP.
      </span>
      <Button type="button" onClick={onRenew}>
        Renew Licence
      </Button>
    </div>
  );
}

function DesktopRequired() {
  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="brand-mark">R</div>
        <h1>Open the desktop app</h1>
        <p>
          Retail ERP requires its licensed desktop runtime. Open Retail ERP.app
          to activate a licence and use your workspace.
        </p>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  window.retailDesktop ? <App /> : <DesktopRequired />,
);

if (
  import.meta.env.PROD &&
  location.protocol !== "retail:" &&
  "serviceWorker" in navigator
)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js").catch(() => {}),
  );
