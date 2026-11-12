import test from "node:test";
import assert from "node:assert/strict";
import { printOptions, PRINT_DEFAULTS } from "../src/lib/print-options.mjs";

test("old settings without print options print with defaults", () => {
  const o = printOptions({ printFormat: "80mm" });
  assert.equal(o.paper, "80mm");
  assert.equal(o.accent, PRINT_DEFAULTS.accent);
  assert.equal(o.show.serial, true);
  assert.equal(o.titles.tax, "TAX INVOICE");
});

test("custom values apply and unsafe values are rejected", () => {
  const o = printOptions({
    printFormat: "A4",
    print: {
      paper: "A5",
      accent: "red; background:url(x)",
      font: "Comic Sans",
      fontSize: 99,
      margin: -4,
      logo: "javascript:alert(1)",
      titles: { tax: "  ", plain: "BILL" },
      labels: { billTo: "Customer" },
      show: { hsn: false, serial: "no" },
    },
  });
  assert.equal(o.paper, "A5");
  assert.equal(o.accent, PRINT_DEFAULTS.accent);
  assert.equal(o.font, PRINT_DEFAULTS.font);
  assert.equal(o.fontSize, 18);
  assert.equal(o.margin, 0);
  assert.equal(o.logo, "");
  assert.equal(o.titles.tax, "TAX INVOICE");
  assert.equal(o.titles.plain, "BILL");
  assert.equal(o.labels.billTo, "Customer");
  assert.equal(o.show.hsn, false);
  assert.equal(o.show.serial, true);
});

test("a valid accent colour and image logo are kept", () => {
  const o = printOptions({ print: { accent: "#AA3300", logo: "data:image/png;base64,AAAA" } });
  assert.equal(o.accent, "#AA3300");
  assert.equal(o.logo, "data:image/png;base64,AAAA");
});
