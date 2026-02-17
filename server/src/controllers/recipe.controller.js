import mongoose from "mongoose";
import Recipe from "../models/recipes.model.js";
import MenuItem from "../models/menuItem.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Unit from "../models/baseUnit.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cacheService } from "../services/cache.service.js";

export const normalizeRecipeItems = async ({
  recipeItems,
  tenantId,
}) => {
  const unitIds = [
    ...new Set(recipeItems.map(i => i.unitId?.toString())),
  ];

  const units = await Unit.find({
    "tenant.tenantId": tenantId,
    _id: { $in: unitIds },
  })
    .select("_id conversionRate baseUnit")
    .lean();

  if (units.length !== unitIds.length) {
    throw new ApiError(400, "One or more units are invalid");
  }

  const unitMap = new Map(
    units.map(u => [u._id.toString(), u])
  );

  return recipeItems.map(item => {
    const qty = Number(item.qty ?? item.Qty);

    if (!qty || qty <= 0) {
      throw new ApiError(
        400,
        `Invalid quantity for ${item.ingredientName}`
      );
    }

    const unit = unitMap.get(item.unitId.toString());

    if (!unit?.conversionRate) {
      throw new ApiError(
        400,
        `Invalid unit config for ${item.ingredientName}`
      );
    }

    return {
      ingredientMasterId: item.ingredientMasterId,
      ingredientName: item.ingredientName,
      qty,
      baseQty: qty * unit.conversionRate,
      unit: item.unit,
    };
  });
};

export const updateRecipeCache = async (
  tenantId,
  itemId,
  recipe
) => {
  const cacheKey = cacheService.generateKey(
    "recipe",
    tenantId,
    itemId
  );

  await cacheService.set(cacheKey, recipe);
};

// export const createOrUpdateRecipe = asyncHandler(async (req, res) => {
//   if (req.user.role !== "BRAND_ADMIN") {
//     throw new ApiError(403, "Only BRAND_ADMIN can manage recipes");
//   }

//   const { itemId, recipeItems } = req.body;

//   if (!itemId || !Array.isArray(recipeItems) || recipeItems.length === 0) {
//     throw new ApiError(
//       400,
//       "itemId and at least one recipeItem are required"
//     );
//   }

//   if (!mongoose.Types.ObjectId.isValid(itemId)) {
//     throw new ApiError(400, "Invalid itemId");
//   }

//   const tenantContext = req.user.tenant;
//   if (!tenantContext?.tenantId) {
//     throw new ApiError(400, "User is not associated with any tenant");
//   }

//   const menuItem = await MenuItem.findOne({
//     _id: itemId,
//     "tenant.tenantId": tenantContext.tenantId,
//   }).lean();

//   if (!menuItem) {
//     throw new ApiError(
//       404,
//       "Menu item not found or does not belong to your tenant"
//     );
//   }


//   const unitIds = [
//     ...new Set(
//       recipeItems.map(i => i.unitId?.toString())
//     ),
//   ];

//   const units = await Unit.find({
//     _id: { $in: unitIds },
//   })
//     .select("_id conversionRate baseUnit")
//     .lean();

//   if (units.length !== unitIds.length) {
//     throw new ApiError(
//       400,
//       "One or more units are invalid"
//     );
//   }

//   const unitMap = new Map(
//     units.map(u => [u._id.toString(), u])
//   );

//   const normalizedRecipeItems = recipeItems.map(item => {

//     const qty = Number(item.Qty);
//     if (!qty || qty <= 0) {
//       throw new ApiError(
//         400,
//         `Invalid quantity for ${item.ingredientName}`
//       );
//     }

//     const unit = unitMap.get(item.unitId.toString());
//     if (!unit || !unit.conversionRate) {
//       throw new ApiError(
//         400,
//         `Invalid unit configuration for ${item.ingredientName}`
//       );
//     }

//     const baseQty = qty * unit.conversionRate;

//     return {
//       ingredientMasterId: item.ingredientMasterId,
//       ingredientName: item.ingredientName,

//       qty,
//       baseQty,
//       unit: item.unit,
//     };
//   });

//   const recipe = await Recipe.findOneAndUpdate(
//     {
//       "tenant.tenantId": tenantContext.tenantId,
//       "item.itemId": menuItem._id,
//     },
//     {
//       tenant: {
//         tenantId: tenantContext.tenantId,
//         tenantName: tenantContext.tenantName,
//       },
//       item: {
//         itemId: menuItem._id,
//         itemName: menuItem.itemName,
//       },
//       recipeItems: normalizedRecipeItems,
//     },
//     {
//       new: true,
//       upsert: true,
//       runValidators: true,
//     }
//   );

//   const cacheKey = cacheService.generateKey(
//     "recipe",
//     tenantContext.tenantId,
//     menuItem._id
//   );
//   await cacheService.set(cacheKey, recipe);

//   return res.status(200).json(
//     new ApiResoponse(
//       200,
//       recipe,
//       "Recipe created / updated successfully"
//     )
//   );
// });

export const createOrUpdateRecipe = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can manage recipes");
  }

  const { itemId, recipeItems } = req.body;

  if (!itemId || !Array.isArray(recipeItems) || recipeItems.length === 0) {
    throw new ApiError(400, "itemId and recipeItems required");
  }

  const tenantContext = req.user.tenant;

  const menuItem = await MenuItem.findOne({
    _id: itemId,
    "tenant.tenantId": tenantContext.tenantId,
  }).lean();

  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }

  const normalizedRecipeItems =
    await normalizeRecipeItems({
      recipeItems,
      tenantId: tenantContext.tenantId,
    });

  const recipe = await Recipe.findOneAndUpdate(
    {
      "tenant.tenantId": tenantContext.tenantId,
      "item.itemId": menuItem._id,
    },
    {
      tenant: tenantContext,
      item: {
        itemId: menuItem._id,
        itemName: menuItem.itemName,
      },
      recipeItems: normalizedRecipeItems,
    },
    { new: true, upsert: true }
  );

  await updateRecipeCache(
    tenantContext.tenantId,
    menuItem._id,
    recipe
  );

  return res.status(200).json(
    new ApiResoponse(200, recipe, "Recipe updated")
  );
});

export const bulkCreateRecipes = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can manage recipes");
  }

  const { recipesByItem } = req.body;

  if (!recipesByItem || Object.keys(recipesByItem).length === 0) {
    throw new ApiError(400, "Recipes object required");
  }

  const tenantContext = req.user.tenant;


  const itemNames = Object.keys(recipesByItem);

  const menuItems = await MenuItem.find({
    "tenant.tenantId": tenantContext.tenantId,
    itemName: { $in: itemNames.map(n => new RegExp(`^${n}$`, "i")) },
  }).lean();

  const itemMap = new Map(
    menuItems.map(i => [i.itemName.toLowerCase(), i])
  );

  const ingredientNames = [
    ...new Set(
      Object.values(recipesByItem).flat().map(r => r.IngredientName?.trim()).filter(Boolean)
    ),
  ];

  const ingredients = await IngredientMaster.find({
    "tenant.tenantId": tenantContext.tenantId,
    name: { $in: ingredientNames.map(n => new RegExp(`^${n}$`, "i")) },
  }).lean();

  const ingredientMap = new Map(
    ingredients.map(i => [i.name.toLowerCase(), i])
  );

  const operations = [];
  const cacheUpdates = [];
  const errors = [];

  for (const itemName of itemNames) {
    const menuItem = itemMap.get(itemName.toLowerCase());

    if (!menuItem) {
      errors.push(`Menu item '${itemName}' not found`);
      continue;
    }

    try {
      const mappedRecipeItems = recipesByItem[itemName].map(r => {
        const ingredient = ingredientMap.get(
          r.IngredientName?.trim().toLowerCase()
        );

        if (!ingredient) {
          throw new Error(
            `Ingredient '${r.IngredientName}' not found`
          );
        }

        const unit = ingredient.unit.find(
          u => u.unitName.toLowerCase() === r.Unit?.trim().toLowerCase()
        );

        if (!unit) {
          throw new Error(
            `Unit '${r.Unit}' invalid for '${r.IngredientName}'`
          );
        }

        return {
          ingredientMasterId: ingredient._id,
          ingredientName: ingredient.name,
          qty: r.Quantity,
          unitId: unit.unitId,
          unit: unit.unitName,
        };
      });

      const recipeItems = await normalizeRecipeItems({
        recipeItems: mappedRecipeItems,
        tenantId: tenantContext.tenantId,
      });

      operations.push({
        updateOne: {
          filter: {
            "tenant.tenantId": tenantContext.tenantId,
            "item.itemId": menuItem._id,
          },
          update: {
            $set: {
              tenant: tenantContext,
              item: {
                itemId: menuItem._id,
                itemName: menuItem.itemName,
              },
              recipeItems,
            },
          },
          upsert: true,
        },
      });

      cacheUpdates.push(menuItem._id);
    } catch (err) {
      errors.push(`${itemName}: ${err.message}`);
    }
  }

  let insertedCount = 0;
  let updatedCount = 0;

  if (operations.length) {
    const result = await Recipe.bulkWrite(operations);

    insertedCount = result.upsertedCount || 0;
    updatedCount = result.modifiedCount || 0;
  }

  await Promise.all(
    cacheUpdates.map(async (itemId) => {
      const recipe = await Recipe.findOne({
        "tenant.tenantId": tenantContext.tenantId,
        "item.itemId": itemId,
      });

      return updateRecipeCache(
        tenantContext.tenantId,
        itemId,
        recipe
      );
    })
  );

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        insertedCount,
        updatedCount,
        processed: insertedCount + updatedCount,
        failed: errors.length,
        errors,
      },
      "Bulk recipes processed"
    )
  );
});


export const getSingleRecipe = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can view recipes");
  }

  const { itemId } = req.params;
  const tenantContext = req.user.tenant;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, "Invalid itemId");
  }

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const cacheKey = cacheService.generateKey("recipe", tenantContext.tenantId, itemId);
  let recipe = await cacheService.get(cacheKey);

  if (!recipe) {
    recipe = await Recipe.findOne({
      "tenant.tenantId": tenantContext.tenantId,
      "item.itemId": itemId,
    }).lean();

    if (recipe) {
      await cacheService.set(cacheKey, recipe);
    }
  }

  if (!recipe) {
    return res.status(200).json(
      new ApiResoponse(200, {}, "Recipe doesn't exist")
    );
  }

  const ingredientIds = recipe.recipeItems.map(
    i => i.ingredientMasterId
  );

  const ingredients = await IngredientMaster.find({
    _id: { $in: ingredientIds },
  }).lean();

  const ingredientMap = new Map(
    ingredients.map(i => [i._id.toString(), i])
  );

  const transformedRecipeItems = recipe.recipeItems.map(item => {
    const ingredient = ingredientMap.get(
      item.ingredientMasterId.toString()
    );

    if (!ingredient) {
      throw new ApiError(
        500,
        `Ingredient not found for recipe item ${item.ingredientName}`
      );
    }
    // console.log(ingredient);

    const selectedUnit = ingredient.unit.find(
      u => u.unitName === item.unit
    );

    if (!selectedUnit) {
      throw new ApiError(
        500,
        `Unit ${item.unit} not configured for ingredient ${ingredient.name}`
      );
    }

    return {
      ingredientId: item.ingredientMasterId,
      ingredientName: item.ingredientName,
      quantity: item.qty,
      unitName: item.unit,
    };
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        _id: recipe._id,
        item: recipe.item,
        recipeItems: transformedRecipeItems,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      },
      "Recipe fetched successfully"
    )
  );
});
