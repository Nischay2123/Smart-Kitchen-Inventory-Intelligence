import mongoose from "mongoose";
import Recipe from "../models/recipes.model.js";
import MenuItem from "../models/menuItem.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createOrUpdateRecipe = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can manage recipes");
  }

  const { itemId, recipeItems } = req.body;

  if (!itemId || !Array.isArray(recipeItems) || recipeItems.length === 0) {
    throw new ApiError(
      400,
      "itemId and at least one recipeItem are required"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, "Invalid itemId");
  }

  const tenantContext = req.user.tenant;
  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const menuItem = await MenuItem.findOne({
    _id: itemId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!menuItem) {
    throw new ApiError(
      404,
      "Menu item not found or does not belong to your tenant"
    );
  }

  const ingredientIds = recipeItems.map(
    i => new mongoose.Types.ObjectId(i.ingredientId)
  );

  const ingredients = await IngredientMaster.find({
    _id: { $in: ingredientIds },
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (ingredients.length !== ingredientIds.length) {
    throw new ApiError(
      400,
      "One or more ingredients are invalid or not part of your tenant"
    );
  }

  const ingredientMap = new Map(
    ingredients.map(i => [i._id.toString(), i])
  );

  const normalizedRecipeItems = recipeItems.map(item => {
    const ingredient = ingredientMap.get(
      item.ingredientId.toString()
    );

    if (!ingredient) {
      throw new ApiError(400, "Invalid ingredient reference");
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new ApiError(
        400,
        `Invalid quantity for ${ingredient.name}`
      );
    }

    const baseQty =
      item.quantity * ingredient.unit.conversionRate;

    return {
      ingredientMasterId: ingredient._id,
      ingredientName: ingredient.name,
      baseQty,
      baseUnit: ingredient.unit.baseUnit, 
    };
  });

  const recipe = await Recipe.findOneAndUpdate(
    {
      "tenant.tenantId": tenantContext.tenantId,
      "item.itemId": menuItem._id,
    },
    {
      tenant: {
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
      },
      item: {
        itemId: menuItem._id,
        itemName: menuItem.itemName,
      },
      recipeItems: normalizedRecipeItems,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return res.status(200).json(
    new ApiResoponse(
      200,
      recipe,
      "Recipe created / updated successfully"
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

  const recipe = await Recipe.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    "item.itemId": itemId,
  }).lean();

  if (!recipe) {
    return res.status(200).json(
      new ApiResoponse(
        200,
        {},
        "Recipe doesn't exist"
      )
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

    return {
      ingredientId: item.ingredientMasterId,
      ingredientName: item.ingredientName,
      quantity: item.baseQty / ingredient.unit.conversionRate,
      unitName: ingredient.unit.unitName,
    };
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        ...recipe,
        recipeItems: transformedRecipeItems,
      },
      "Recipe fetched successfully"
    )
  );
});
