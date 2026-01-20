import mongoose from "mongoose";
import Recipe from "../models/recipes.model.js";
import { ApiError } from "../utils/apiError.js";

export const buildStockRequirement = async (items, tenantId) => {

  
  const itemIds = items.map(i => new mongoose.Types.ObjectId(i.itemId));

  console.log(itemIds);
  
  const recipes = await Recipe.find({
    "tenant.tenantId": tenantId,
    "item.itemId": { $in: itemIds }
  }).lean();

  const recipeMap = new Map();
  recipes.forEach(r => {
    recipeMap.set(String(r.item.itemId), r);
  });

  const requirementMap = new Map();

  for (const orderItem of items) {

    const recipe = recipeMap.get(String(orderItem.itemId));

    if (!recipe) {
      throw new ApiError(400, `Recipe not found for item ${orderItem.itemName}`);
    }

    for (const ing of recipe.recipeItems) {

      const totalQty =
        ing.baseQty * orderItem.qty;

      const key = String(ing.ingredientMasterId);

      requirementMap.set(
        key,
        (requirementMap.get(key) || 0) + totalQty
      );
    }
  }

  // Convert to array structure
  return Array.from(requirementMap.entries()).map(
    ([ingredientMasterId, qty]) => ({
      ingredientMasterId,
      requiredBaseQty: qty,
    })
  );
};
