import Sales from "../models/sale.model.js";
import MenuItem from "../models/menuItem.model.js";
import Recipe from "../models/recipes.model.js";
import Stock from "../models/stock.model.js";
import { emitEvent } from "../workers/socket.js";


export const processSalesSnapshot = async (data) => {
  const {
    orderId,
    tenant,
    outlet,
    state,          
    items,          
  } = data;

  const sale = await Sales.findById(orderId);
  if (!sale) return;

  const itemIds = items.map(i => i.itemId);

  const [menus, recipes] = await Promise.all([
    MenuItem.find({ _id: { $in: itemIds } }).lean(),
    Recipe.find({
      "tenant.tenantId": tenant.tenantId,
      "item.itemId": { $in: itemIds },
    }).lean(),
  ]);

  const menuMap = new Map(menus.map(m => [String(m._id), m]));
  const recipeMap = new Map(
    recipes.map(r => [String(r.item.itemId), r])
  );

  const ingredientIds = [
    ...new Set(
      recipes.flatMap(r =>
        r.recipeItems.map(i => String(i.ingredientMasterId))
      )
    ),
  ];

  const stocks = await Stock.find({
    "outlet.outletId": outlet.outletId,
    "masterIngredient.ingredientMasterId": { $in: ingredientIds },
  }).lean();

  const stockMap = new Map(
    stocks.map(s => [
      String(s.masterIngredient.ingredientMasterId),
      s,
    ])
  );

  const finalItems = sale.items.map(item => {
    if (state !== "CONFIRMED") {
      return {
        ...item.toObject(),
        totalAmount: 0,
        makingCost: 0,
      };
    }

    const menu = menuMap.get(String(item.itemId));
    const recipe = recipeMap.get(String(item.itemId));

    if (!menu || !recipe) return item.toObject();

    let makingCost = 0;

    for (const ing of recipe.recipeItems) {
      const stock = stockMap.get(
        String(ing.ingredientMasterId)
      );
      if (!stock) continue;

      makingCost += ing.baseQty * stock.unitCost * item.qty;
    }

    return {
      ...item.toObject(),
      totalAmount: menu.price * item.qty,
      makingCost,
    };
  });

  const saleRecord = await Sales.findOneAndUpdate(
    { _id: orderId, state: "PENDING" },
    {
      $set: {
        state,
        items: finalItems,
      },
    },
    {
      new: true,
    }
  ).lean();


  const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
  emitEvent(room, "SALES_CREATED", 
    saleRecord
  );
};
