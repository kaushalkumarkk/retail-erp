const { test } = require("node:test");
const assert = require("node:assert/strict");
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
async function unlock(page) {
  await page
    .getByRole("heading", { name: /Secure your workspace|Welcome back/ })
    .waitFor();
  const setup = await page
    .getByRole("heading", { name: "Secure your workspace", exact: true })
    .isVisible();
  if (setup) {
    await page
      .getByLabel("New Password", { exact: true })
      .fill("RetailTest!23");
    await page
      .getByLabel("Confirm Password", { exact: true })
      .fill("RetailTest!23");
    await page.getByRole("button", { name: "Set Password & Continue" }).click();
    await page
      .getByRole("button", { name: "Continue to Workspace", exact: true })
      .click();
  } else {
    await page.getByLabel("Password", { exact: true }).fill("RetailTest!23");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
  }
}
test("desktop starts without a server, saves data, and preserves it after relaunch", async () => {
  const profile = await fs.mkdtemp(
    path.join(os.tmpdir(), "retail-desktop-test-"),
  );
  let app;
  const launch = () =>
    electron.launch({
      args: [path.resolve(".")],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: undefined,
        ERP_TEST_PROFILE: profile,
      },
    });
  try {
    app = await launch();
    let page = await app.firstWindow();
    await unlock(page);
    await page
      .getByRole("heading", { name: "RAHUL JEE TRADING COMPANY" })
      .waitFor();
    assert.equal(new URL(page.url()).protocol, "retail:");
    const imported = await page.evaluate(
      () => JSON.parse(localStorage.getItem("retailer-erp:v1")).items,
    );
    assert.equal(imported.length, 109);
    assert.equal(imported.find((i) => i.name === "AATA 10KG").stock, -431);
    assert.equal(
      imported.reduce((sum, i) => sum + i.stock * i.cost, 0),
      3880770,
    );
    assert.equal(
      await page
        .getByRole("button", { name: /Dark Mode|Light Mode|Toggle theme/ })
        .count(),
      0,
    );
    assert.equal(await page.locator("html").getAttribute("data-theme"), null);
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().width === 64,
    );
    assert.equal(
      await page.locator(".app-shell").getAttribute("class"),
      "app-shell expanded",
    );
    await page.keyboard.press("Control+b");
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().width ===
        240,
    );
    await page.screenshot({ path: "/tmp/retail-medical-dashboard.png" });
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Items & Inventory", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.querySelector("main")).maxWidth,
      ),
      "none",
    );
    await page
      .getByRole("button", { name: "Add New Product", exact: true })
      .click();
    await page.screenshot({ path: "/tmp/retail-medical-item-form.png" });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add Item (F5)", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Product Name")
      .fill("Desktop Stock");
    await page.getByRole("dialog").getByLabel("Opening Stock").fill("12");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Save Product" })
      .click();
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("retailer-erp:v1")).items.length ===
        110,
    );
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("retailer-erp:v1")).items.find(
            (i) => i.name === "Desktop Stock",
          ).stock,
      ),
      12,
    );
    assert.equal(
      await app.evaluate(
        ({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
            .nodeIntegration,
      ),
      false,
    );
    await app.close();
    app = null;
    app = await launch();
    page = await app.firstWindow();
    await unlock(page);
    await page
      .getByRole("heading", { name: "RAHUL JEE TRADING COMPANY" })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("retailer-erp:v1")).items.find(
            (i) => i.name === "Desktop Stock",
          ).name,
      ),
      "Desktop Stock",
    );
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("retailer-erp:v1")).items.length,
      ),
      110,
    );
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Express POS", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Express POS", exact: true })
      .waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector(".sidebar").getBoundingClientRect().width === 64,
    );
    await page
      .getByRole("combobox", { name: "Add Product / Search Item" })
      .fill("AASHI TILL TEL 1L");
    await page
      .getByRole("combobox", { name: "Add Product / Search Item" })
      .press("Enter");
    const rows = await page.locator(".full-width-lines").boundingBox();
    const dock = await page.locator(".billing-dock").boundingBox();
    assert.ok(Math.abs(rows.width - dock.width) < 2);
    assert.ok(dock.y >= rows.y + rows.height - 2);
    assert.ok(rows.width > 1100);
    await page.screenshot({ path: "/tmp/retail-fullwidth-billing.png" });
    assert.ok(
      (await page
        .locator(".document-main")
        .evaluate((el) => el.getBoundingClientRect().width)) > 450,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Items & Inventory", exact: true })
      .click();
    assert.equal(await page.locator(".records tbody tr").count(), 20);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    assert.match(await page.locator(".record-count").innerText(), /21–40/);
    assert.equal(await page.locator(".records tbody tr").count(), 20);
    await page.getByRole("button", { name: "Last page", exact: true }).click();
    assert.match(await page.locator(".record-count").innerText(), /101–110/);
    assert.equal(await page.locator(".records tbody tr").count(), 10);
    await page
      .getByRole("textbox", { name: "Search records" })
      .fill("Desktop Stock");
    assert.equal(await page.locator(".records tbody tr").count(), 1);
    assert.equal(
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .isDisabled(),
      true,
    );
    assert.match(await page.locator(".record-count").innerText(), /1–1/);
    const viewport = await page.locator(".records>.table-wrap").boundingBox();
    assert.ok(viewport.height > 300);
    const pager = await page
      .getByRole("navigation", { name: "Table pagination" })
      .boundingBox();
    assert.ok(
      pager.y + pager.height <= (await page.evaluate(() => innerHeight)),
    );
    for (const label of [
      "Parties (Customers/Vendors)",
      "Sales & Invoices",
      "Purchases",
      "Payment In & Out",
      "Expenses",
      "Double-Entry Accounting",
      "GST Filing Reports",
    ]) {
      await page
        .locator(".sidebar")
        .getByRole("button", { name: label, exact: true })
        .click();
      const wrap = await page.locator(".records>.table-wrap").boundingBox();
      assert.ok(
        wrap.height > 150,
        `${label} table should fill the available height`,
      );
      const footer = await page
        .getByRole("navigation", { name: "Table pagination" })
        .boundingBox();
      assert.ok(
        footer.y + footer.height <= (await page.evaluate(() => innerHeight)),
        `${label} pagination must stay visible`,
      );
    }
    await page.screenshot({ path: "/tmp/retail-fullheight-table.png" });
  } finally {
    if (app) await app.close();
    await fs.rm(profile, { recursive: true, force: true });
  }
});
