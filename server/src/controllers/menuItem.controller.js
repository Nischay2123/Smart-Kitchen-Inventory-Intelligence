import MenuItem from "../models/menuItem.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { paginate } from "../utils/pagination.js";
import Recipe from "../models/recipes.model.js";
import IngredientMaster from "../models/ingredientMaster.model.js";
import {
  normalizeRecipeItems,
  updateRecipeCache,
} from "./recipe.controller.js";



const resolveRecipeItems = async (recipeItems, tenantId) => {
  const alreadyResolved = recipeItems.every(
    (r) => r.ingredientMasterId && r.unitId
  );
  if (alreadyResolved) return recipeItems;

  const ingredientNames = [
    ...new Set(
      recipeItems
        .map((r) => r.ingredientName?.trim())
        .filter(Boolean)
    ),
  ];

  const ingredients = await IngredientMaster.find({
    "tenant.tenantId": tenantId,
    name: { $in: ingredientNames },
  }).lean();

  const ingredientMap = new Map(
    ingredients.map((i) => [i.name.toLowerCase(), i])
  );

  return recipeItems.map((r) => {
    const ingredient = ingredientMap.get(
      r.ingredientName?.trim().toLowerCase()
    );

    if (!ingredient) {
      throw new ApiError(
        400,
        `Ingredient '${r.ingredientName}' not found`
      );
    }

    const unit = ingredient.unit?.find(
      (u) => u.unitName.toLowerCase() === r.unit?.trim().toLowerCase()
    );

    if (!unit) {
      throw new ApiError(
        400,
        `Unit '${r.unit}' not found for ingredient '${r.ingredientName}'`
      );
    }

    return {
      ingredientMasterId: ingredient._id,
      ingredientName: ingredient.name,
      qty: Number(r.qty),
      unitId: unit.unitId,
      unit: unit.unitName,
    };
  });
};


export const createMenuItem = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can create menu items");
  }

  const items = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Request body must be an array");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User not associated with tenant");
  }

  const errors = [];
  let inserted = 0;
  let recipeCreated = 0;

  const existingItems = await MenuItem.find({
    "tenant.tenantId": tenantContext.tenantId,
  }).select("itemName");

  const existingNames = new Set(
    existingItems.map(i => i.itemName.trim().toLowerCase())
  );

  for (let index = 0; index < items.length; index++) {
    const row = items[index];
    const { itemName, price, recipeItems } = row;

    if (!itemName || price === undefined) {
      errors.push(`Row ${index + 1}: Missing itemName or price`);
      continue;
    }

    if (price < 0) {
      errors.push(`Row ${index + 1}: Price must be >= 0`);
      continue;
    }

    const trimmedName = itemName.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (existingNames.has(normalizedName)) {
      errors.push(`Row ${index + 1}: Item '${trimmedName}' already exists`);
      continue;
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const [menuItem] = await MenuItem.create(
          [
            {
              tenant: {
                tenantId: tenantContext.tenantId,
                tenantName: tenantContext.tenantName,
              },
              itemName: trimmedName,
              price,
            },
          ],
          { session }
        );

        inserted++;
        existingNames.add(normalizedName);

        if (recipeItems?.length) {
          const resolvedItems = await resolveRecipeItems(
            recipeItems,
            tenantContext.tenantId
          );

          const normalizedRecipeItems = await normalizeRecipeItems({
            recipeItems: resolvedItems,
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
            { new: true, upsert: true, session }
          );

          await updateRecipeCache(
            tenantContext.tenantId,
            menuItem._id,
            recipe
          );

          recipeCreated++;
        }
      });
    } catch (err) {
      errors.push(`Row ${index + 1}: ${err.message}`);
    } finally {
      session.endSession();
    }
  }

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        inserted,
        failed: errors.length,
        recipeCreated,
        errors,
      },
      "Bulk menu item creation completed"
    )
  );
});



export const getAllMenuItems = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can view menu items");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  const { search = "", page = 1, limit = 10 } = req.query;

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };

  const { data: menuItems, meta } = await paginate(MenuItem, filter, {
    page,
    limit,
    search,
    searchField: "itemName",
    sort: { createdAt: -1 }
  });

  return res.status(200).json(
    new ApiResoponse(
      200,
      {
        menuItems,
        pagination: meta
      },
      "Menu items fetched successfully"
    )
  );
});



export const deleteMenuItem = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { menuItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      throw new ApiError(400, "Invalid menuItemId");
    }

    const tenantContext = req.user.tenant;

    const menuItem = await MenuItem.findOne(
      {
        _id: menuItemId,
        "tenant.tenantId": tenantContext.tenantId,
      },
      null,
      { session }
    );

    if (!menuItem) {
      throw new ApiError(404, "Menu item not found");
    }

    await MenuItem.deleteOne(
      { _id: menuItem._id },
      { session }
    );

    await Recipe.deleteOne(
      {
        "tenant.tenantId": tenantContext.tenantId,
        "item.itemId": menuItem._id,
      },
      { session }
    );

    await updateRecipeCache(
      tenantContext.tenantId,
      menuItem._id,
      null
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResoponse(
        200,
        { menuItemId: menuItem._id },
        "Deleted successfully"
      )
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

