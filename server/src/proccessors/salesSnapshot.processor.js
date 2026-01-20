import Sales from "../models/sale.model.js";
import MenuItem from "../models/menuItem.model.js";
import Stock from "../models/stock.model.js";
import Recipe from "../models/recipes.model.js";
import { emitEvent } from "../workers/socket.js";

export const processSalesSnapshot = async (data) => {

  const {
    requestId,
    items,
    tenant,
    outlet,
    state = "CONFIRMED",
  } = data;
  console.log("processSalesSnapshot", requestId);

  const saleItems = [];

  for (const i of items) {


    const menu = await MenuItem.findOne({
      _id: i.itemId,
      "tenant.tenantId": tenant.tenantId,
    }).lean();

    if (!menu) {
      console.log("MENU NOT FOUND FOR", i.itemId);
      continue;      
    }

    const recipe = await Recipe.findOne({
      "tenant.tenantId": tenant.tenantId,
      "item.itemId": i.itemId,
    }).lean();

    if (!recipe) {
      console.log("not");

    }

    let makingCost = 0;

    for (const ing of recipe.recipeItems) {

      const stock = await Stock.findOne({
        "outlet.outletId": outlet.outletId,
        "masterIngredient.ingredientMasterId":
          ing.ingredientMasterId,
      }).lean();

      if (!stock) continue;

      makingCost +=
        ing.baseQty * stock.unitCost * i.qty;
    }

    saleItems.push({
      itemId: i.itemId,
      itemName: menu.itemName,
      qty: i.qty,
      totalAmount: menu.price * i.qty,
      makingCost,
    });
  }

  if (saleItems.length === 0) return;

  const result = await Sales.findOneAndUpdate(
    { requestId },

    {
      $setOnInsert: {
        requestId,
        tenant: {
          tenantId: tenant.tenantId,
          tenantName: tenant.tenantName,
        },

        outlet: {
          outletId: outlet.outletId,
          outletName: outlet.outletName,
        },

        items: saleItems,

        state,
      },
    },

    { 
      new:true,
      upsert: true 
    }
  );

  if (!result.lastErrorObject?.upserted) {
    const room = `tenant:${tenant.tenantId}:outlet:${outlet.outletId}`;
    console.log(result);
    
    emitEvent(room, "SALES_CREATED", result.toObject());  
  }
};

