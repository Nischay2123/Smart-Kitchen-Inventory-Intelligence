export const buildStockRequirement = async (items, recipeMap) => {
  const requirementMap = new Map();
  const recipeErrors = [];

  for (const orderItem of items) {
    const recipe = recipeMap.get(String(orderItem.itemId));

    if (!recipe) {
      recipeErrors.push({
        itemId: orderItem.itemId,
        itemName: orderItem.itemName,
        qty: orderItem.qty,
      });
      continue;
    }

    for (const ing of recipe.recipeItems) {
      const totalQty = ing.baseQty * orderItem.qty;
      const key = String(ing.ingredientMasterId);

      if (requirementMap.has(key)) {
        requirementMap.get(key).requiredBaseQty += totalQty;
      } else {
        requirementMap.set(key, {
          ingredientMasterId: key,
          ingredientName: ing.ingredientName,
          requiredBaseQty: totalQty,
        });
      }
    }
  }

  return {
    requirementList: Array.from(requirementMap.values()),
    recipeErrors,
  };
};
