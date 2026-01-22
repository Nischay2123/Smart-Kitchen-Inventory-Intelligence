import mongoose from "mongoose";
import Recipe from "../models/recipes.model.js";
import MenuItem from "../models/menuItem.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import Unit from "../models/baseUnit.model.js";
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
  }).lean();

  if (!menuItem) {
    throw new ApiError(
      404,
      "Menu item not found or does not belong to your tenant"
    );
  }



  /* -------------------- Unit Fetch (SINGLE CALL) -------------------- */
  const unitIds = [
    ...new Set(
      recipeItems.map(i => i.unitId?.toString())
    ),
  ];

  const units = await Unit.find({
    _id: { $in: unitIds },
  })
    .select("_id conversionRate baseUnit")
    .lean();

  if (units.length !== unitIds.length) {
    throw new ApiError(
      400,
      "One or more units are invalid"
    );
  }

  const unitMap = new Map(
    units.map(u => [u._id.toString(), u])
  );

  /* -------------------- Normalize Recipe Items -------------------- */
  const normalizedRecipeItems = recipeItems.map(item => {

    const qty = Number(item.Qty);
    if (!qty || qty <= 0) {
      throw new ApiError(
        400,
        `Invalid quantity for ${item.ingredientName}`
      );
    }

    const unit = unitMap.get(item.unitId.toString());
    if (!unit || !unit.conversionRate) {
      throw new ApiError(
        400,
        `Invalid unit configuration for ${item.ingredientName}`
      );
    }

    const baseQty = qty * unit.conversionRate;

    return {
      ingredientMasterId: item.ingredientMasterId,
      ingredientName: item.ingredientName,

      qty,               
      baseQty,           
      unit: item.unit,   
    };
  });

  /* -------------------- Upsert Recipe -------------------- */
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

  // 1️⃣ Fetch recipe
  const recipe = await Recipe.findOne({
    "tenant.tenantId": tenantContext.tenantId,
    "item.itemId": itemId,
  }).lean();

  if (!recipe) {
    return res.status(200).json(
      new ApiResoponse(200, {}, "Recipe doesn't exist")
    );
  }

  // 2️⃣ Fetch ingredient masters
  const ingredientIds = recipe.recipeItems.map(
    i => i.ingredientMasterId
  );

  const ingredients = await IngredientMaster.find({
    _id: { $in: ingredientIds },
  }).lean();

  const ingredientMap = new Map(
    ingredients.map(i => [i._id.toString(), i])
  );

  // 3️⃣ Transform recipe items
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
    console.log(ingredient);
    
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
