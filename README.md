# Retail ERP

Local-first retailer ERP built in this folder using the Rahul Jee Trading reference interface and the React approach and shared currency/GST-state utilities from `../Medical/medical_erp`. The medical project is unchanged. The user-supplied 109-product Rahul catalog is bundled and imported once. No sample invoices or customers are seeded.

## Desktop app (primary)

Open `release/mac-arm64/Retail ERP.app` directly, or open the DMG in `release/` and drag **Retail ERP** into Applications. Activate an annual licence before opening the workspace; see [LICENSING.md](LICENSING.md). The app bundles the interface and Electron runtime; it needs no browser, local server, Node installation, or internet connection on the target computer.

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

POS receipts and invoice previews share the supplied NG-1081 invoice layout: teal item headings and total, customer and invoice details, payment status, outstanding balance, amount in Indian currency words, terms and signature lines. A4 printing uses this layout; 80mm and 58mm formats stack the sections for narrow printers. Customer address and phone are saved with new invoices. Reprints show current payment allocations and party balances.

Sales, POS and purchase entry include **Loading Charge (₹)** and **Bill Discount (₹)**. These fixed amounts apply after item discounts and before GST, allocated proportionally across item values and their GST rates. Printed bills show the item subtotal, bill discount and loading charge separately. Tax reports, balances, full payments, sales revenue and purchase inventory costs use the adjusted values. Bill discount cannot exceed the item subtotal; loading charge requires a positive item subtotal. Old invoices retain their original totals, and POS checkout clears both fields for the next bill.

### Optional browser development preview

```sh
npm run dev:web
```

`npm run build:ui` builds the shared interface and `npm run preview` serves it for browser testing. This browser preview stores data separately from the desktop app. Production browser builds also support service-worker offline caching; Electron loads bundled assets directly and does not need a service worker.

## Desktop screen layout

The desktop uses the medical ERP’s white/green screen style, compact tables, full-width workspaces and wider three-column product/party forms. It opens maximized. The navigation button or Ctrl/Cmd+B collapses the sidebar to icons and expands the working area; this preference is remembered. The appearance is fixed to the medical ERP’s light workspace, with no theme switch. POS and invoice entry automatically collapse the sidebar to expand the billing area.

## Included modules

- Dashboard: live sales, receivables, payables, cash/bank, inventory valuation, seven-day trends, low-stock alerts, quick actions.
- GST and non-GST sales: line quantities, editable rates, discounts, customer credit limits, intra/interstate tax splits, partial payments, invoice registers, cancellation, A4/80mm/58mm printing and browser Save as PDF.
- Express POS: catalog, category filters, barcode search with Enter, cart, payment mode, receipt, automatic cart clearing after checkout.
- Purchases: supplier bills, stock inward, weighted average inventory cost, partial/full payments, cancellation with stock safeguards.
- Parties: customers/suppliers, contacts, GSTIN/state, opening balances, credit limits, transaction statements.
- Products: categories, HSN, unique barcodes, units, purchase/sale rates, GST percentage, opening stock, stock adjustments, reorder levels.
- Payments and expenses: customer collections, supplier payouts, modes and references, expense categories and local input tax.
- Accounting: balanced automatic journals, trial balance, profit/loss, GST outward/summary/HSN working reports, date filters and CSV exports.
- Business settings, bank/UPI text details on invoices, local operator profiles, full JSON backup/restore, CSV inventory import, guarded reset.
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

Reference: https://rahultrading.online/app and the supplied screenshots. Its public pages were inspected for visible navigation and screen structure. This implementation recreates those visible modules locally; it is not a copy of the reference site's private source, database, or protected behavior. Unlike the reference's server SQLite storage, this project explicitly uses browser localStorage. Cloud accounts, cloud synchronization, Excel XLSX imports, UPI QR generation, and portal filing integrations are not implemented. Local operators now sign in with salted password hashes. This protects normal application access; it does not encrypt business records or prevent someone with filesystem/profile access from editing local data. Keep the computer and backups private.

## Verify

```sh
npm test
npm run test:desktop
npm run build
npm run test:browser
npm run test:offline
```

The desktop test launches Electron with a temporary isolated profile, creates an item, closes and relaunches the app, and verifies persistence. Browser tests use installed Google Chrome. Set `ERP_BROWSER_CHANNEL=chromium` if using a separately installed Playwright Chromium browser. Tests run isolated browser contexts and do not change your normal browser's business data. Unit tests cover transactions, tax, inventory, credits, cancellations, imports and backup validation. Browser tests exercise the business workflows, mobile layout, persistence, restore, and production offline reload.

## Supplied product catalog (v1.0.2)

The supplied JSON is retained in `src/data/rahul-products.json`. On first launch of this version, missing products are added once, with an import marker saved alongside the workspace. Existing matching IDs, names or barcodes are preserved, and later stock movements are never reset by reopening or upgrading the app. Reset preserves the import marker so cleared products do not automatically return.

All 109 products retain their source IDs, SKU, HSN, rates, category, units and stock; original metadata including MRP and wholesale rate is retained with each imported item. Imported stock valuation totals ₹38,80,770.00. The 21 negative quantities are preserved and block sales until replenished. Three products have no source unit; their display unit defaults to PCS while the original null unit is retained in metadata. Prices are copied as supplied, including any differences between sale rate and MRP.

Sales, purchases, and POS share a full-width product search and invoice table. Customer/supplier details, tax totals, payment controls and Save sit in a full-width bottom dock. The table scrolls independently while the payment controls remain visible on desktop. Search supports product names, HSN, SKU and barcode, with keyboard selection and Enter to add. All screens use a fixed white/teal retail workspace with no appearance setting.

## v1.0.3 workspace layout

Product entry and invoice rows occupy the full workspace width, without a catalog or checkout side column. The payment dock follows the table across the bottom, borrowing the medical ERP’s workflow while using a distinct retail layout. Non-billing screens use fluid widths, consistent page headers, expandable search toolbars, and unrestricted report/settings work areas. The desktop test verifies table/dock geometry as well as catalog persistence.

## Register pagination

Inventory, parties, sales, purchases, payments, expenses and report tables show 20 matching records per page, with First/Previous/Next/Last navigation, page count and visible record range. Searches and filter changes return to page one. Deleting records clamps the current page to the remaining range. CSV export continues to include the complete filtered result, rather than just the visible page. Invoice entry and printed invoices retain all line items.

## Register table height

Desktop registers and accounting/GST tables fill the remaining window height, even with a short or empty result. Rows scroll inside the panel, column headers stay visible, and the 20-record pagination bar stays at the bottom. Report controls use compact spacing to reserve more space for rows. Mobile layouts keep page scrolling for narrow screens.

## Financial year and reporting period

The top-header calendar opens a working financial-year/date-range selector. Choose a year, Today, This Month, All Dates, or a custom range, then Apply Period. Custom ranges within a selected year must stay within April–March; choose All years for ranges spanning years. The choice is remembered on this device. It scopes transaction registers, dashboard activity/recent transactions/trends, accounting, P&L and GST reports. Stock, reorder alerts, cash/bank and current party balances remain current. New invoice dates still default to today, independently of the reporting filter. Reports can further narrow the header period using their date controls. Backups always contain the complete workspace.

## Passwords and operators

On first launch, the existing administrator sets a password (8–128 characters). Products and transactions are preserved. Save the recovery code shown on the next screen; it can be downloaded once. Then continue to the workspace. Later launches and reloads require sign-in. No default password is supplied.

Click the top-right avatar (**Your Account**) to change your password, switch operators, or sign out. Password changes verify the current password. Admin Panel & Roles creates operators with an initial password and lets an administrator reset another operator’s password after confirming their own. Staff cannot open admin, settings or backup screens. Switching operators requires their password. Passwords are never stored as plaintext: PBKDF2-SHA256 uses a random salt and 310,000 iterations. Live sessions are held only in renderer memory; changing credentials invalidates an old session when the workspace is refreshed/synchronized.

**Forgot Password?** on sign-in accepts the administrator recovery code and a new password, works offline, and issues a replacement recovery code. The old code stops working once the reset is committed. Operators without a recovery code ask an administrator for a reset. Recovery codes are stored as hashes, while the downloaded copy must be kept private. Restoring a JSON backup also restores the operators/password hashes in that backup; sign in with those credentials afterward. Business records remain localStorage data, not encrypted files.

## Annual shop licensing and password visibility

All password fields include accessible show/hide eye buttons (setup, sign-in, change/reset, recovery, and new operators). Passwords start hidden; the visibility button does not submit the form.

Retail ERP now requires a machine-bound, signed annual licence and locks the complete business interface at expiry. The licence/renewal page and 30-day warning support yearly renewals. Read [LICENSING.md](LICENSING.md) for issuing commands, renewal timing, the local owner activation key, key custody, backup access while locked, and offline enforcement limits. Shop installers never contain the private signing key or the issuing CLI. Browser preview now displays a desktop-runtime-required screen unless a test bridge is supplied by the automated UI harness.

### Credit / Udhaar billing

Select **Credit / Udhaar** in a sales, POS or purchase bill's **Payment Mode**, then select the customer or supplier. Credit bills record zero received/paid and leave the entire total outstanding against that party; customer credit limits still apply. The receipt shows Credit / Udhaar and UNPAID. Collect or pay later through **Payment In & Out** using the actual payment method. For a partial payment at billing time, choose the actual method (Cash, UPI, etc.), turn off the full-payment checkbox and enter the received/paid amount. POS returns to Cash and full payment after checkout.
