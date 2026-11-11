import { test, expect } from "@playwright/test";
test("inventory, customer, GST billing, payment, persistence, reports and backup", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
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
    .getByLabel("Add Product")
    .selectOption({ label: "Premium Rice · 20 PCS · ₹70.00" });
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
test("POS resets cart after checkout, theme and mobile navigation work", async ({
  page,
}) => {
  await page.goto("/");
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
  await page.getByRole("button", { name: "General Tea ₹20.00 10 PCS" }).click();
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
  await page.getByRole("button", { name: "Light Mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("CSV inventory import, purchase, expense, and JSON restore", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Items & Inventory" })
    .click();
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator("input[type=file]")
    .setInputFiles({
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
    .selectOption({ label: "Soap · 10 PCS · ₹10.00" });
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
  await page
    .locator("input[type=file]")
    .setInputFiles({
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
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
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
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("retailer-erp:v1")).items[0].name,
    ),
  ).toBe("Offline Item");
});
