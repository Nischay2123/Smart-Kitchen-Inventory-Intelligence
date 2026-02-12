import mongoose from "mongoose";
import Sale from "../models/sale.model.js"
import StockMovement from "../models/stockMovement.model.js"
import Outlet from "../models/outlet.model.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import TenantDailySnapshot from "../models/tenantDailySnapshot.model.js";

export const itemsProfitPerDeployement = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Unauthorized");
  }

  const { fromDate, toDate, outletId } = req.query;
  const tenant = req.user.tenant;

  const pipeline = [
    {
      $match: {
        "tenant.tenantId": tenant.tenantId,
        state: "CONFIRMED",
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
        "outlet.outletId": new mongoose.Types.ObjectId(outletId),
      },
    },
    {
      $project: { items: 1 }
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.itemId",
        itemName: { $first: "$items.itemName" },
        totalQty: { $sum: "$items.qty" },
        totalRevenue: { $sum: "$items.totalAmount" },
        totalMakingCost: { $sum: "$items.makingCost" },
      },
    },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        totalQty: 1,
        totalRevenue: 1,
        totalMakingCost: 1,
        profit: { $subtract: ["$totalRevenue", "$totalMakingCost"] },
        profitMargin: {
          $cond: [
            { $gt: ["$totalRevenue", 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$totalRevenue", "$totalMakingCost"] },
                    "$totalRevenue",
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
  ];



  const data = await Sale.aggregate(pipeline, { allowDiskUse: true });
  return res.status(200).json(new ApiResoponse(200, data, "success"));
});

export const ingredientUsageAndBurnRate = asyncHandler(async (req, res) => {
  if (req.user.role !== "OUTLET_MANAGER") {
    throw new ApiError(403, "Unauthorized");
  }

  const tenant = req.user.tenant;
  const { fromDate, toDate } = req.query;
  const outletId = req.user.outlet.outletId

  const match = {
    "tenant.tenantId": tenant.tenantId,
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    reason: "ORDER",
  };

  if (outletId) {
    match["outlet.outletId"] = new mongoose.Types.ObjectId(outletId);
  }

  const data = await StockMovement.aggregate([
    { $match: match },

    {
      $group: {
        _id: "$ingredient.ingredientMasterId",
        ingredientName: { $first: "$ingredient.ingredientMasterName" },
        totalQty: { $sum: "$quantity" },
        unit: { $first: "$unit" },
        noOfOrders: { $sum: 1 },
        totalCost: {
          $sum: { $multiply: ["$quantity", "$unitCost"] },
        },
      },
    },

    {
      $project: {
        _id: 0,
        ingredientId: "$_id",
        ingredientName: 1,
        totalQty: 1,
        unit: 1,
        noOfOrders: 1,
        totalCost: { $round: ["$totalCost", 2] },

        avgQtyPerOrder: {
          $cond: [
            { $gt: ["$noOfOrders", 0] },
            { $round: [{ $divide: ["$totalQty", "$noOfOrders"] }, 2] },
            0,
          ],
        },

        avgCostPerOrder: {
          $cond: [
            { $gt: ["$noOfOrders", 0] },
            { $round: [{ $divide: ["$totalCost", "$noOfOrders"] }, 2] },
            0,
          ],
        },
      },
    },

    { $sort: { totalCost: -1 } },
  ]);

  return res.status(200).json(
    new ApiResoponse(200, data, "success")
  );
});


export const brandAnalyticsSnapshotReport = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Unauthorized Request");
  }

  const tenantContext = req.user.tenant;
  const { fromDate, toDate } = req.query;

  if (!tenantContext) {
    throw new ApiError(403, "Unauthorized Request");
  }
  const { outletIds } = req.body;
  const from = new Date(fromDate);
  const to = new Date(toDate);

  const snapshotStart = new Date(from.setUTCHours(0, 0, 0, 0));
  const snapshotEnd = new Date(to.setUTCHours(23, 59, 59, 999));
  const outletObjectIds = outletIds.map((i) => new mongoose.Types.ObjectId(i))


  const pipeline = [
    {
      $match: {
        "tenant.tenantId": tenantContext.tenantId,
        "outlet.outletId": { $in: outletObjectIds },
        date: { $gte: snapshotStart, $lte: snapshotEnd }
      }
    },
    {
      $group: {
        _id: { outletId: "$outlet.outletId" },
        outletName: { $first: "$outlet.outletName" },
        totalSale: { $sum: "$totalSale" },
        confirmedOrders: { $sum: "$confirmedOrders" },
        canceledOrders: { $sum: "$canceledOrders" },
        cogs: { $sum: "$cogs" }
      }
    },
    {
      $project: {
        _id: 0,
        outletId: "$_id.outletId",
        outletName: "$outletName",
        totalSale: 1,
        confirmedOrders: 1,
        canceledOrders: 1,
        cogs: 1
      }
    },
  ];

  const result = await TenantDailySnapshot.aggregate(pipeline);

  return res.status(200).json(
    new ApiResoponse(200, result, "Snapshot analytics fetched successfully")
  );
});

export const brandAnalyticsLiveReport = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Unauthorized Request");
  }

  const tenantContext = req.user.tenant;

  if (!tenantContext) {
    throw new ApiError(403, "Unauthorized Request");
  }
  const { outletIds } = req.body;
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const outletObjectIds = outletIds.map((i) => new mongoose.Types.ObjectId(i))
  // const pipeline = [
  //   {
  //     $match: {
  //       "tenant.tenantId": tenantContext.tenantId,
  //       "outlet.outletId": { $in: outletObjectIds },
  //       createdAt: { $gte: todayStart }
  //     }
  //   },
  //   { $unwind: "$items" },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       outlet: { $first: "$outlet" },
  //       state: { $first: "$state" },
  //       sale: { $sum: "$items.totalAmount" },
  //       cogs: { $sum: "$items.makingCost" }
  //     }
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         outletId: "$outlet.outletId",
  //         outletName: "$outlet.outletName"
  //       },
  //       totalSale: {
  //         $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0] }
  //       },
  //       cogs: {
  //         $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$cogs", 0] }
  //       },
  //       confirmedOrders: {
  //         $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0] }
  //       },
  //       canceledOrders: {
  //         $sum: { $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0] }
  //       }
  //     }
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       outletId: "$_id.outletId",
  //       outletName: "$_id.outletName",
  //       totalSale: 1,
  //       confirmedOrders: 1,
  //       canceledOrders: 1,
  //       cogs: 1
  //     }
  //   },
  // ];

  const pipeline = [
    {
      $match: {
        "tenant.tenantId": tenantContext.tenantId,
        "outlet.outletId": { $in: outletObjectIds },
        createdAt: { $gte: todayStart }
      }
    },

    {
      $project: {
        outletId: "$outlet.outletId",
        outletName: "$outlet.outletName",
        state: 1,
        sale: { $sum: "$items.totalAmount" },
        cogs: { $sum: "$items.makingCost" }
      }
    },

    {
      $group: {
        _id: {
          outletId: "$outletId",
          outletName: "$outletName"
        },

        totalSale: {
          $sum: {
            $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0]
          }
        },

        cogs: {
          $sum: {
            $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$cogs", 0]
          }
        },

        confirmedOrders: {
          $sum: {
            $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0]
          }
        },

        canceledOrders: {
          $sum: {
            $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0]
          }
        }
      }
    },

    {
      $project: {
        _id: 0,
        outletId: "$_id.outletId",
        outletName: "$_id.outletName",
        totalSale: 1,
        confirmedOrders: 1,
        canceledOrders: 1,
        cogs: 1
      }
    }
  ];

  const result = await Sale.aggregate(pipeline);

  return res.status(200).json(
    new ApiResoponse(200, result, "Live analytics fetched successfully")
  );
});


export const menuEngineeringMatrix = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(400, "Unauthorized Request ,Only Brand Manager can see the details")
  }

  const tenantContext = req.user.tenant
  const { toDate, fromDate } = req.query;
  // console.log(tenantContext,toDate,fromDate);

  if (!tenantContext) {
    throw new ApiError(400, "Unauthorized Request")
  }

  const data = await Sale.aggregate([
    {
      $match: {
        "tenant.tenantId": tenantContext.tenantId,
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
        state: "CONFIRMED",
      },
    },

    {
      $project: { items: 1 }
    },

    { $unwind: "$items" },

    {
      $group: {
        _id: "$items.itemId",
        itemName: { $first: "$items.itemName" },
        qty: { $sum: "$items.qty" },
        profit: {
          $sum: {
            $subtract: ["$items.totalAmount", "$items.makingCost"],
          },
        },
      },
    },

    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              avgQty: { $avg: "$qty" },
              avgProfit: { $avg: "$profit" },
            },
          },
        ],
        items: [
          {
            $project: {
              _id: 0,
              itemId: "$_id",
              itemName: 1,
              qty: 1,
              profit: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        avgQty: { $arrayElemAt: ["$stats.avgQty", 0] },
        avgProfit: { $arrayElemAt: ["$stats.avgProfit", 0] },
        items: 1,
      },
    },

    {
      $project: {
        items: {
          $map: {
            input: "$items",
            as: "i",
            in: {
              itemId: "$$i.itemId",
              itemName: "$$i.itemName",
              qty: "$$i.qty",
              profit: "$$i.profit",
              category: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $and: [
                          { $gte: ["$$i.qty", "$avgQty"] },
                          { $gte: ["$$i.profit", "$avgProfit"] },
                        ],
                      },
                      then: "STAR",
                    },
                    {
                      case: {
                        $and: [
                          { $lt: ["$$i.qty", "$avgQty"] },
                          { $gte: ["$$i.profit", "$avgProfit"] },
                        ],
                      },
                      then: "PUZZLE",
                    },
                    {
                      case: {
                        $and: [
                          { $gte: ["$$i.qty", "$avgQty"] },
                          { $lt: ["$$i.profit", "$avgProfit"] },
                        ],
                      },
                      then: "PLOWHORSE",
                    },
                  ],
                  default: "DOG",
                },
              },
            },
          },
        },
      },
    },
  ], { allowDiskUse: true });


  return res.status(200).json(new ApiResoponse(200, data[0]?.items || [], "success"));
});

export const getOutlets = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(400, "Unauthorized Request ,Only Brand Manager can see the details")
  }
  const tenantContext = req.user.tenant;
  const outlets = await Outlet.find({
    "tenant.tenantId": tenantContext.tenantId
  }).select("tenant outletName")

  if (!outlets) {
    throw new ApiError(200, [], `No Outlet found for the Brand: ${tenantContext.tenantName}`)
  }

  return res.status(200).json(
    new ApiResoponse(200, outlets, "Oulets Fetched Successfully")
  )
})
