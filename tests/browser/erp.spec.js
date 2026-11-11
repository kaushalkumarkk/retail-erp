import { test, expect } from "@playwright/test";
import {
  fresh,
  saveItem,
  postDocument,
  financialYear,
} from "../../src/lib/engine.mjs";
import { CATALOG_IMPORT } from "../../src/lib/catalog.mjs";
const TEST_PASSWORD = "RetailTest!23";
async function unlock(page) {
  const heading = page.getByRole("heading", {
    name: /Secure your workspace|Welcome back/,
  });
  await heading.waitFor();
  if (
    await page
      .getByRole("heading", { name: "Secure your workspace", exact: true })
      .isVisible()
  ) {
    await page.getByLabel("New Password", { exact: true }).fill(TEST_PASSWORD);
    await page
      .getByLabel("Confirm Password", { exact: true })
      .fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Set Password & Continue" }).click();
    await page
      .getByRole("button", { name: "Continue to Workspace", exact: true })
      .click();
  } else {
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
  }
  await page
    .getByRole("heading", { name: "RAHUL JEE TRADING COMPANY", exact: true })
    .waitFor();
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (seed) => {
      if (!localStorage.getItem("retailer-erp:v1"))
        localStorage.setItem("retailer-erp:v1", JSON.stringify(seed));
    },
    { ...fresh(), catalogImports: [CATALOG_IMPORT] },
  );
});
test("inventory, customer, GST billing, payment, persistence, reports and backup", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await unlock(page);
  await expect(
    page.getByRole("heading", { name: "RAHUL JEE TRADING COMPANY" }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/retail-dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add Item (F5)", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Product Name").fill("Premium Rice");
  await dialog.getByLabel("Purchase Price").fill("50");
  await dialog.getByLabel("Sale Price").fill("70");
  await dialog.getByLabel("Opening Stock").fill("20");
  await dialog.getByLabel("GST %").fill("5");
  await dialog.getByRole("button", { name: "Save Product" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add Party (F4)", exact: true })
    .click();
  await dialog.getByLabel("Party Name").fill("Test Customer");
  await dialog.getByRole("button", { name: "Save Party" }).click();
  await page
    .getByRole("button", { name: "New Sale (F1)", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .selectOption({ label: "Test Customer" });
  await page
    .getByRole("combobox", { name: "Add Product / Search Item" })
    .fill("Premium Rice");
  await page.getByRole("option", { name: /Premium Rice/ }).click();
  await page.getByLabel("Premium Rice quantity").fill("2");
  await page.getByLabel("Amount Received").fill("47");
  await page.getByRole("button", { name: "Save Invoice", exact: true }).click();
  await expect(dialog.getByText("₹147.00", { exact: true })).toHaveCount(2);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.keyboard.press("F6");
  await dialog
    .getByRole("combobox", { name: "Party *", exact: true })
    .selectOption({ label: "Test Customer" });
  await dialog.getByLabel("Amount *", { exact: true }).fill("100");
  await dialog
    .getByRole("button", { name: "Record Payment", exact: true })
    .click();
  await page.reload();
  await unlock(page);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Items & Inventory" })
    .click();
  await expect(
    page.getByRole("cell", { name: "18 PCS", exact: true }),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Parties (Customers/Vendors)" })
    .click();
  await page
    .getByRole("button", { name: "Test Customer", exact: true })
    .click();
  await expect(
    dialog.getByText("₹0.00", { exact: true }).first(),
  ).toBeVisible();
  await expect(dialog.getByText("Payment In · Cash")).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Double-Entry Accounting" })
    .click();
  await expect(page.getByText("Balanced", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Journal Entries", exact: true })
    .click();
  await expect(
    page
      .getByRole("cell", { name: "Accounts receivable", exact: true })
      .first(),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Profit & Loss (P&L)" })
    .click();
  await expect(page.getByText("₹40.00", { exact: true }).first()).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Backup & Data Export" })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Full Backup" }).click();
  expect((await downloadPromise).suggestedFilename()).toContain(
    "retailer-backup",
  );
  expect(errors).toEqual([]);
});
test("POS resets cart after checkout, fixed appearance and mobile navigation work", async ({
  page,
}) => {
  await page.goto("/");
  await unlock(page);
  await page
    .getByRole("button", { name: "Add Item (F5)", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Product Name").fill("Tea");
  await dialog.getByLabel("Purchase Price").fill("10");
  await dialog.getByLabel("Sale Price").fill("20");
  await dialog.getByLabel("Opening Stock").fill("10");
  await dialog.getByRole("button", { name: "Save Product" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Express POS" })
    .click();
  await page.getByRole("option", { name: /Tea/ }).click();
  await page.getByRole("button", { name: "Save & View Receipt" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("heading", { name: "Your cart is empty" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Dashboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "RAHUL JEE TRADING COMPANY" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await expect(page.locator(".sidebar")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, -254, 0)",
  );
  await page.screenshot({
    path: "/tmp/retail-dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("button", { name: /Dark Mode|Light Mode|Toggle theme/ }),
  ).toHaveCount(0);
  await page.reload();
  await unlock(page);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});
test("CSV inventory import, purchase, expense, and JSON restore", async ({
  page,
}) => {
  await page.goto("/");
  await unlock(page);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Items & Inventory" })
    .click();
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input[type=file]").setInputFiles({
    name: "stock.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name,category,hsn,barcode,unit,cost,price,gst,stock,min\nSoap,General,3401,SOAP,PCS,10,20,18,10,2",
    ),
  });
  await dialog.getByRole("button", { name: "Import 1 Products" }).click();
  await expect(
    page.getByRole("cell", { name: "Soap PCS", exact: false }),
  ).toBeVisible();
  await page.keyboard.press("F4");
  await dialog.getByLabel("Party Name").fill("Supply Co");
  await dialog
    .getByRole("combobox", { name: "Party Type", exact: true })
    .selectOption("Supplier");
  await dialog.getByRole("button", { name: "Save Party" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Purchases", exact: true })
    .click();
  await page.getByRole("button", { name: "Record Purchase Bill" }).click();
  await page
    .getByRole("combobox", { name: "Supplier *", exact: true })
    .selectOption({ label: "Supply Co" });
  await page
    .getByRole("combobox", { name: "Add Product / Search Item" })
    .fill("Soap");
  await page.getByRole("option", { name: /Soap/ }).click();
  await page.getByLabel("Soap quantity").fill("5");
  await page.getByLabel("Paid in full").check();
  await page
    .getByRole("button", { name: "Save Purchase Bill", exact: true })
    .click();
  await expect(
    dialog.getByText("PUR/2026-27/0001", { exact: false }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Expenses", exact: true })
    .click();
  await page.getByRole("button", { name: "Record Expense" }).click();
  await dialog.getByLabel("Expense Title").fill("Shop Rent");
  await dialog.getByLabel("Taxable Amount").fill("100");
  await dialog.getByRole("button", { name: "Record Expense" }).click();
  await expect(
    page.getByRole("cell", { name: "Shop Rent", exact: true }),
  ).toBeVisible();
  const snapshot = await page.evaluate(() =>
    localStorage.getItem("retailer-erp:v1"),
  );
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Backup & Data Export" })
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(snapshot),
  });
  await expect(
    dialog.getByText(/1 products, 1 parties and 1 documents/),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await unlock(page);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("retailer-erp:v1")),
  );
  expect(saved.items[0].stock).toBe(15);
  expect(saved.expenses[0].total).toBe(100);
  expect(saved.documents).toHaveLength(1);
});
test("production build reloads offline", async ({ page, context }) => {
  test.skip(
    !process.env.ERP_TEST_PRODUCTION,
    "Offline cache is enabled in production builds.",
  );
  await page.goto("/");
  await unlock(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await unlock(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await unlock(page);
  await expect(
    page.getByRole("heading", { name: "RAHUL JEE TRADING COMPANY" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add Item (F5)", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Product Name")
    .fill("Offline Item");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save Product" })
    .click();
  await page.reload();
  await unlock(page);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("retailer-erp:v1")).items[0].name,
    ),
  ).toBe("Offline Item");
});
test("password change, sign out, protected operator switching and admin password reset", async ({
  page,
}) => {
  await page.goto("/");
  await unlock(page);
  await page.getByTitle("Your Account", { exact: true }).click();
  await page
    .getByRole("button", { name: "Change Password", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await d
    .getByLabel("Current Password", { exact: true })
    .fill("wrong-password");
  await d.getByLabel("New Password", { exact: true }).fill("ChangedTest!45");
  await d
    .getByLabel("Confirm New Password", { exact: true })
    .fill("ChangedTest!45");
  await d.getByRole("button", { name: "Change Password", exact: true }).click();
  await expect(d.getByRole("alert")).toContainText("incorrect");
  await d.getByLabel("Current Password", { exact: true }).fill(TEST_PASSWORD);
  await d.getByRole("button", { name: "Change Password", exact: true }).click();
  await expect(d).toHaveCount(0);
  await page.getByTitle("Your Account", { exact: true }).click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByLabel("Password", { exact: true }).fill("ChangedTest!45");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Admin Panel & Roles", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Operator", exact: true }).click();
  await d.getByLabel("Operator Name").fill("Counter");
  await d.getByLabel("Initial Password").fill("CounterTest!23");
  await d
    .getByLabel("Confirm Password", { exact: true })
    .fill("CounterTest!23");
  await d.getByRole("button", { name: "Add Operator", exact: true }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Counter" })
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await d.getByLabel("Your Administrator Password").fill("ChangedTest!45");
  await d.getByLabel("New Password", { exact: true }).fill("CounterReset!45");
  await d.getByLabel("Confirm New Password").fill("CounterReset!45");
  await d.getByRole("button", { name: "Reset Password", exact: true }).click();
  await expect(d).toHaveCount(0);
  await page.getByTitle("Your Account", { exact: true }).click();
  await d.locator(".switch-user").filter({ hasText: "Counter" }).click();
  await page.getByLabel("Password", { exact: true }).fill("CounterTest!23");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByLabel("Password", { exact: true }).fill("CounterReset!45");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "RAHUL JEE TRADING COMPANY",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .locator(".sidebar")
      .getByRole("button", { name: "Admin Panel & Roles", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
});
test("header financial year and custom dates scope registers, persist and preserve inventory", async ({
  page,
}) => {
  await page.goto("/");
  await unlock(page);
  const year = Number(financialYear().slice(0, 4));
  let fixture = saveItem(fresh(), {
    name: "Period Product",
    stock: 10,
    cost: 10,
    price: 20,
    gst: 0,
    min: 0,
  });
  for (const date of [`${year - 1}-05-10`, `${year}-05-10`])
    fixture = postDocument(fixture, {
      type: "sale",
      gst: false,
      date,
      paid: 20,
      mode: "Cash",
      partyId: "",
      lines: [{ itemId: fixture.items[0].id, qty: 1, rate: 20 }],
    }).db;
  await page.evaluate((data) => {
    const db = JSON.parse(localStorage.getItem("retailer-erp:v1"));
    localStorage.setItem(
      "retailer-erp:v1",
      JSON.stringify({
        ...db,
        items: data.items,
        documents: data.documents,
        journals: data.journals,
      }),
    );
  }, fixture);
  await page.reload();
  await unlock(page);
  await page
    .getByRole("button", { name: "Change financial year and date range" })
    .click();
  const d = page.getByRole("dialog");
  await d
    .getByRole("combobox", { name: "Financial Year", exact: true })
    .selectOption(`${year - 1}-${String(year).slice(2)}`);
  await d.getByRole("button", { name: "Apply Period" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Non-GST Invoices", exact: true })
    .click();
  await expect(page.locator(".records tbody tr")).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: `${year - 1}-05-10`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Change financial year and date range" })
    .click();
  await d.getByRole("button", { name: "All Dates", exact: true }).click();
  await d.getByRole("button", { name: "Apply Period" }).click();
  await expect(page.locator(".records tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Change financial year and date range" })
    .click();
  await d.getByLabel("From Date", { exact: true }).fill(`${year}-05-01`);
  await d.getByLabel("To Date", { exact: true }).fill(`${year}-05-31`);
  await d.getByRole("button", { name: "Apply Period" }).click();
  await expect(page.locator(".records tbody tr")).toHaveCount(1);
  await expect(
    page.getByRole("cell", { name: `${year}-05-10`, exact: true }),
  ).toBeVisible();
  await page.reload();
  await unlock(page);
  await expect(
    page.getByRole("button", { name: "Change financial year and date range" }),
  ).toContainText(`${year}-05-01`);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Items & Inventory", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "8 PCS", exact: true }),
  ).toBeVisible();
});
test("administrator can recover a forgotten password offline and the old recovery code is revoked", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("New Password", { exact: true }).fill(TEST_PASSWORD);
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Set Password & Continue" }).click();
  const code = page.getByTestId("recovery-code");
  await expect(code).toHaveText(/^RT-/);
  const original = await code.innerText();
  await page.getByRole("button", { name: "Continue to Workspace" }).click();
  await page.getByTitle("Your Account", { exact: true }).click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page
    .getByRole("button", { name: "Forgot Password?", exact: true })
    .click();
  await page.getByLabel("Recovery Code").fill("RT-INVALID");
  await page
    .getByLabel("New Password", { exact: true })
    .fill("RecoveredTest!45");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("RecoveredTest!45");
  await page
    .getByRole("button", { name: "Reset Password", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByLabel("Recovery Code").fill(original);
  await page
    .getByRole("button", { name: "Reset Password", exact: true })
    .click();
  await expect(code).toHaveText(/^RT-/);
  expect(await code.innerText()).not.toBe(original);
  await page.getByRole("button", { name: "Continue to Workspace" }).click();
  await page.getByTitle("Your Account", { exact: true }).click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await page.getByLabel("Password", { exact: true }).fill("RecoveredTest!45");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "RAHUL JEE TRADING COMPANY",
      exact: true,
    }),
  ).toBeVisible();
});
