import { saveItem } from "./engine.mjs";
export const CATALOG_IMPORT = "rahul-products-2026-11-11";
export function applyProductCatalog(state, payload) {
  if (state.catalogImports?.includes(CATALOG_IMPORT)) return state;
  if (payload.success !== true || !Array.isArray(payload.products))
    throw Error("Invalid supplied catalog.");
  let db = structuredClone(state);
  for (const p of payload.products) {
    // Add only: imported stock and subsequent transactions are never overwritten.
    if (
      db.items.some(
        (i) =>
          i.sourceProductId === p.id ||
          i.id === p.id ||
          i.name.trim().toLowerCase() === p.name.trim().toLowerCase() ||
          (p.barcode && i.barcode === p.barcode),
      )
    )
      continue;
    if (p.isInclusiveTax)
      throw Error("Inclusive-tax catalog requires price conversion.");
    db = saveItem(db, {
      id: p.id,
      sourceProductId: p.id,
      name: p.name,
      sku: p.sku || "",
      barcode: p.barcode || "",
      hsn: p.hsnCode || "",
      category: p.category?.name || "General",
      unit: p.unit?.shortName || "PCS",
      cost: p.purchasePrice,
      price: p.salePrice,
      gst: p.gstRate,
      stock: p.currentStock,
      min: p.minStock || 0,
      mrp: p.mrp,
      wholesalePrice: p.wholesalePrice,
      maxStock: p.maxStock,
      active: p.isActive !== false,
      sourceProduct: p,
    });
  }
  db.catalogImports = [...(db.catalogImports || []), CATALOG_IMPORT];
  return db;
}
