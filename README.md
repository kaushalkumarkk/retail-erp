# Retail ERP

Local-first retailer ERP built in this folder using the Rahul Jee Trading reference interface and the React approach and shared currency/GST-state utilities from `../Medical/medical_erp`. The medical project is unchanged. No sample products, inventory, invoices, or customers are seeded.

## Desktop app (primary)

Open `release/mac-arm64/Retail ERP.app` directly, or open the DMG in `release/` and drag **Retail ERP** into Applications. The app bundles the interface and Electron runtime; it needs no browser, local server, Node installation, or internet connection on the target computer.

Development launch:

```sh
npm install
npm start
```

Build the desktop app and installers for the current platform:

```sh
npm run build
```

`npm run desktop:pack` creates the unpacked app. On this Apple Silicon Mac the output is a macOS arm64 app, DMG and ZIP. The configured Windows NSIS installer can be built on Windows with `npm run build -- --win`; Linux AppImage is also configured. These other platform builds have not been verified here. Mac builds are unsigned and not notarized; macOS may require approving the app in Privacy & Security on a different computer.

The desktop app uses the fixed origin `retail://app` and persistent Electron localStorage under the app's user-data folder (`~/Library/Application Support/Retail ERP` on macOS). **File → Show Local Data Folder** opens the actual folder. Closing or updating the app preserves records. The medical ERP's data and profile are separate. Existing browser-version data does not migrate automatically: export its JSON backup and restore it in the desktop app.

Desktop exports use native save dialogs; invoice printing uses the system print dialog, including Save as PDF. **File → Backup & Restore** opens the backup screen. Export JSON backups regularly.

### Optional browser development preview

```sh
npm run dev:web
```

`npm run build:ui` builds the shared interface and `npm run preview` serves it for browser testing. This browser preview stores data separately from the desktop app. Production browser builds also support service-worker offline caching; Electron loads bundled assets directly and does not need a service worker.

## Included modules

- Dashboard: live sales, receivables, payables, cash/bank, inventory valuation, seven-day trends, low-stock alerts, quick actions.
- GST and non-GST sales: line quantities, editable rates, discounts, customer credit limits, intra/interstate tax splits, partial payments, invoice registers, cancellation, A4/80mm/58mm printing and browser Save as PDF.
- Express POS: catalog, category filters, barcode search with Enter, cart, payment mode, receipt, automatic cart clearing after checkout.
- Purchases: supplier bills, stock inward, weighted average inventory cost, partial/full payments, cancellation with stock safeguards.
- Parties: customers/suppliers, contacts, GSTIN/state, opening balances, credit limits, transaction statements.
- Products: categories, HSN, unique barcodes, units, purchase/sale rates, GST percentage, opening stock, stock adjustments, reorder levels.
- Payments and expenses: customer collections, supplier payouts, modes and references, expense categories and local input tax.
- Accounting: balanced automatic journals, trial balance, profit/loss, GST outward/summary/HSN working reports, date filters and CSV exports.
- Business settings, bank/UPI text details on invoices, themes, local operator profiles, full JSON backup/restore, CSV inventory import, guarded reset.
- Shortcuts: F1 new sale, F4 new party, F5 new item, F6 payment, Ctrl/Cmd+K search, Escape closes dialogs.

## Bring your inventory

Open **Items & Inventory → Import CSV**. Download the empty template and use these headers:

```csv
name,category,hsn,barcode,unit,cost,price,gst,stock,min
```

`name` is required. Numeric values must be nonnegative numbers without currency symbols or thousands separators. `cost` and `price` exclude GST; `gst` is a percentage. `stock` is opening quantity, `min` is the reorder threshold. Blank unit defaults to PCS. Quoted fields and escaped quotes are supported. Import adds products, rejects duplicate barcodes, and saves atomically after all rows pass validation. Do not reimport the same file to update stock. Share a different source export before importing so its columns and prices can be mapped correctly.

## Data and accounting behavior

All records are stored under `retailer-erp:v1` in localStorage inside the desktop app’s persistent profile (or in the browser’s separate profile when previewing). Export a JSON backup in **Backup & Data Export** regularly; clearing browser/site data removes the local records. Restore checks the backup and asks for confirmation before replacement, downloading a copy of the current workspace first. CSV exports are worksheets; JSON is the restorable format. Broken or unsupported existing data shows a recovery screen and is preserved for download.

Sales deduct stock and post revenue, output tax, receivables/cash, and cost of goods sold. Purchases add stock and input tax and update weighted average cost. Separate payments reduce party balances and post cash/bank movements. Payments allocate to opening debt first, then the oldest unpaid invoices. Invoice statuses and balances include these later allocations. Admins can reverse a payment, preserving the original receipt and posting opposite journal entries.

Opening product stock and party balances post against opening equity. Product stock edits post inventory adjustments. The purchase price of products with transactions is maintained by purchase bills. Noncash payment modes post to Bank. Expenses currently split tax into local CGST/SGST. Opening cash/bank is a dashboard setting, separate from transaction journals.

Cancellation preserves the original invoice and posts reversing entries; it is not a partial return/credit note workflow. Purchase cancellation is blocked after later stock transactions, and invoice cancellation is blocked when it would conflict with later party payments. GST reports are review worksheets, not government portal upload schemas or automated filing. Tax percentages are entered by the operator; no automatic retail HSN tax-rate assumptions are made.

## Reference scope

Reference: https://rahultrading.online/app and the supplied screenshots. Its public pages were inspected for visible navigation and screen structure. This implementation recreates those visible modules locally; it is not a copy of the reference site's private source, database, or protected behavior. Unlike the reference's server SQLite storage, this project explicitly uses browser localStorage. Server accounts, authentication, cloud synchronization, Excel XLSX imports, UPI QR generation, and portal filing integrations are not implemented. Local operator profiles control the interface only and are not an authentication/security boundary.

## Verify

```sh
npm test
npm run test:desktop
npm run build
npm run test:browser
npm run test:offline
```

The desktop test launches Electron with a temporary isolated profile, creates an item, closes and relaunches the app, and verifies persistence. Browser tests use installed Google Chrome. Set `ERP_BROWSER_CHANNEL=chromium` if using a separately installed Playwright Chromium browser. Tests run isolated browser contexts and do not change your normal browser's business data. Unit tests cover transactions, tax, inventory, credits, cancellations, imports and backup validation. Browser tests exercise the business workflows, mobile layout, persistence, restore, and production offline reload.
