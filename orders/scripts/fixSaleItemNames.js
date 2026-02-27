/**
 * One-time migration script to fix mismatched itemName values in Sale documents.
 *
 * For every Sale item, looks up the authoritative itemName from MenuItem
 * and corrects it if it differs.
 *
 * Usage:
 *   cd server
 *   node scripts/fixSaleItemNames.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


/* ── Inline schemas (keep script self-contained) ── */

const SaleItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    itemName: String,
    qty: Number,
    totalAmount: Number,
    makingCost: Number,
    cancelIngredientDetails: [mongoose.Schema.Types.Mixed],
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    tenant: mongoose.Schema.Types.Mixed,
    outlet: mongoose.Schema.Types.Mixed,
    state: String,
    items: [SaleItemSchema],
  },
  { timestamps: true, collection: "sales" }
);

const MenuItemSchema = new mongoose.Schema(
  {
    itemName: String,
    price: Number,
  },
  { collection: "menuitems" }
);

const Sale = mongoose.model("Sale", SaleSchema);
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

/* ── Main ── */

const run = async () => {
  await mongoose.connect("mongodb+srv://nischaysharma04:Nischay123@cluster0.vbcoq8e.mongodb.net/SKII");
  console.log("Connected to MongoDB");

  // 1. Build authoritative map: itemId → itemName
  const menuItems = await MenuItem.find({}).select("_id itemName").lean();
  const nameMap = new Map(menuItems.map((m) => [String(m._id), m.itemName]));
  console.log(`Loaded ${nameMap.size} menu items`);

  // 2. Find all sales
  const sales = await Sale.find({}).lean();
  console.log(`Scanning ${sales.length} sale documents...`);

  let fixedCount = 0;
  let itemsFixed = 0;

  for (const sale of sales) {
    let needsUpdate = false;
    const updatedItems = sale.items.map((item) => {
      const correctName = nameMap.get(String(item.itemId));
      if (correctName && correctName !== item.itemName) {
        console.log(
          `  Sale ${sale._id} | itemId ${item.itemId}: "${item.itemName}" → "${correctName}"`
        );
        needsUpdate = true;
        itemsFixed++;
        return { ...item, itemName: correctName };
      }
      return item;
    });

    if (needsUpdate) {
      await Sale.updateOne({ _id: sale._id }, { $set: { items: updatedItems } });
      fixedCount++;
    }
  }

  console.log(`\nDone. Fixed ${itemsFixed} items across ${fixedCount} sale documents.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
