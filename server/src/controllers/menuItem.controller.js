import MenuItem from "../models/menuItem.model.js";
import Tenant from "../models/tenant.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { paginate } from "../utils/pagination.js";


// export const createMenuItem = asyncHandler(async (req, res) => {
//   if (req.user.role !== "BRAND_ADMIN") {
//     throw new ApiError(403, "Only BRAND_ADMIN can create menu items");
//   }

//   const { itemName, price } = req.body;

//   if (!itemName || price === undefined) {
//     throw new ApiError(400, "itemName and price are required");
//   }

//   if (price < 0) {
//     throw new ApiError(400, "Price must be greater than or equal to 0");
//   }

//   const tenantContext = req.user.tenant;

//   if (!tenantContext?.tenantId) {
//     throw new ApiError(400, "User is not associated with any tenant");
//   }


//   const existingItem = await MenuItem.findOne({
//     "tenant.tenantId": tenantContext.tenantId,
//     itemName: itemName.trim(),
//   });

//   if (existingItem) {
//     throw new ApiError(
//       409,
//       "Menu item with this name already exists for this tenant"
//     );
//   }

//   const menuItem = await MenuItem.create({
//     tenant: {
//       tenantId: tenantContext.tenantId,
//       tenantName: tenantContext.tenantName,
//     },
//     itemName: itemName.trim(),
//     price,
//   });

//   return res.status(201).json(
//     new ApiResoponse(
//       201,
//       {
//         _id: menuItem._id,
//         itemName: menuItem.itemName,
//         price: menuItem.price,
//         tenant: menuItem.tenant,
//         createdAt: menuItem.createdAt,
//       },
//       "Menu item created successfully"
//     )
//   );
// });

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
  const validItems = [];

  const existingItems = await MenuItem.find({
    "tenant.tenantId": tenantContext.tenantId,
  }).select("itemName");

  const existingNames = new Set(
    existingItems.map(i => i.itemName.toLowerCase())
  );

  items.forEach((row, index) => {
    const { itemName, price } = row;

    if (!itemName || price === undefined) {
      errors.push(`Row ${index + 1}: Missing itemName or price`);
      return;
    }

    if (price < 0) {
      errors.push(`Row ${index + 1}: Price must be >= 0`);
      return;
    }

    const normalized = itemName.trim().toLowerCase();

    if (existingNames.has(normalized)) {
      errors.push(
        `Row ${index + 1}: Item '${itemName}' already exists`
      );
      return;
    }

    existingNames.add(normalized);

    validItems.push({
      tenant: {
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
      },
      itemName: itemName.trim(),
      price,
    });
  });

  let insertedDocs = [];

  if (validItems.length) {
    insertedDocs = await MenuItem.insertMany(validItems);
  }

  return res.status(201).json(
    new ApiResoponse(
      201,
      {
        inserted: insertedDocs.length,
        failed: errors.length,
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

  const { search="", page = 1, limit = 10 } = req.query;

  const filter = {
    "tenant.tenantId": tenantContext.tenantId,
  };

  // const menuItems = await MenuItem.find(filter).sort({ createdAt: -1 });
  const { data: menuItems, meta } = await paginate(MenuItem, filter, {
    page,
    limit,
    search,
    searchField:"itemName",
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
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Only BRAND_ADMIN can delete menu items");
  }

  const { menuItemId } = req.params;

  const menuItemObjectId = new mongoose.Types.ObjectId(menuItemId)
  const tenantContext = req.user.tenant;
  // console.log(req.params, tenantContext);

  if (!tenantContext?.tenantId) {
    throw new ApiError(400, "User is not associated with any tenant");
  }

  if (!mongoose.Types.ObjectId.isValid(menuItemObjectId)) {
    throw new ApiError(400, "Invalid menuItemId");
  }

  const menuItem = await MenuItem.findOne({
    _id: menuItemObjectId,
    "tenant.tenantId": tenantContext.tenantId,
  });

  if (!menuItem) {
    throw new ApiError(
      404,
      "Menu item not found or does not belong to your tenant"
    );
  }

  await MenuItem.deleteOne({ _id: menuItem._id });

  return res.status(200).json(
    new ApiResoponse(
      200,
      { menuItemId: menuItem._id },
      "Menu item deleted successfully"
    )
  );
});
