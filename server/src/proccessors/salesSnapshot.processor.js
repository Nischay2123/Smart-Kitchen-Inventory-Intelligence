import Sales from "../models/sale.model.js";
import MenuItem from "../models/menuItem.model.js";
import Recipe from "../models/recipes.model.js";
import Stock from "../models/stock.model.js";
import { emitEvent } from "../workers/socket.js";
import { cacheService } from "../services/cache.service.js";

export const processSalesSnapshot = async (data) => {
  const { orderId, tenant, outlet, state, items } = data;

  try {
    const sale = await Sales.findById(orderId);

    const itemIds = [...new Set(items.map((i) => String(i.itemId)))];

    // ── 1. MenuItems: cache-first ─────────────────────────────────────
    const menuMap = new Map();
    {
      const keys = itemIds.map((id) =>
        cacheService.generateKey("menuItem", tenant.tenantId, id)
      );
      let cached = [];
      try {
        cached = await cacheService.mget(keys);
      } catch {
        cached = new Array(itemIds.length).fill(null);
      }

      const missIds = [];
      cached.forEach((menu, i) => {
        if (menu) menuMap.set(itemIds[i], menu);
        else missIds.push(itemIds[i]);
      });

      if (missIds.length > 0) {
        const dbMenus = await MenuItem.find({ _id: { $in: missIds } }).lean();
        for (const menu of dbMenus) {
          const id = String(menu._id);
          menuMap.set(id, menu);
          cacheService
            .set(cacheService.generateKey("menuItem", tenant.tenantId, id), menu)
            .catch((err) => console.error("Cache Write Error (menuItem):", err));
        }
      }
    }

    // ── 2. Recipes: cache-first ───────────────────────────────────────
    const recipeMap = new Map();
    {
      const keys = itemIds.map((id) =>
        cacheService.generateKey("recipe", tenant.tenantId, id)
      );
      let cached = [];
      try {
        cached = await cacheService.mget(keys);
      } catch {
        cached = new Array(itemIds.length).fill(null);
      }

      const missIds = [];
      cached.forEach((recipe, i) => {
        if (recipe) recipeMap.set(itemIds[i], recipe);
        else missIds.push(itemIds[i]);
      });

      if (missIds.length > 0) {
        const dbRecipes = await Recipe.find({
          "tenant.tenantId": tenant.tenantId,
          "item.itemId": { $in: missIds },
        }).lean();
        for (const recipe of dbRecipes) {
          const id = String(recipe.item.itemId);
          recipeMap.set(id, recipe);
          cacheService
            .set(cacheService.generateKey("recipe", tenant.tenantId, id), recipe)
            .catch((err) => console.error("Cache Write Error (recipe):", err));
        }
      }
    }

    // ── 3. Stocks: always fetch from DB (changes frequently) ──────────
    const ingredientIds = [
      ...new Set(
        [...recipeMap.values()].flatMap((r) =>
          (r.recipeItems || []).map((i) => String(i.ingredientMasterId))
        )
      ),
    ];

    const dbStocks = await Stock.find({
      "outlet.outletId": outlet.outletId,
      "masterIngredient.ingredientMasterId": { $in: ingredientIds },
    }).lean();

    const stockMap = new Map(
      dbStocks.map((s) => [String(s.masterIngredient.ingredientMasterId), s])
    );

    // ── 4. Build final items ──────────────────────────────────────────
    const finalItems = sale.items.map((item) => {
      if (state !== "CONFIRMED") {
        return { ...item.toObject(), totalAmount: 0, makingCost: 0 };
      }

      const menu = menuMap.get(String(item.itemId));
      const recipe = recipeMap.get(String(item.itemId));

      if (!menu || !recipe) return item.toObject();

      let makingCost = 0;
      for (const ing of recipe.recipeItems || []) {
        const stock = stockMap.get(String(ing.ingredientMasterId));
        if (!stock) continue;
        makingCost += ing.baseQty * stock.unitCost * item.qty;
      }

      return {
        ...item.toObject(),
        itemName: menu.itemName,
        totalAmount: menu.price * item.qty,
        makingCost,
      };
    });

    const saleRecord = await Sales.findOneAndUpdate(
      { _id: orderId, state: "PENDING" },
      { $set: { state, items: finalItems } },
      { new: true }
    ).lean();

    const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
    emitEvent(room, "SALES_CREATED", saleRecord);
  } catch (err) {
    console.error(`processSalesSnapshot failed order=${orderId}`, err);
    throw err;
  }
};
