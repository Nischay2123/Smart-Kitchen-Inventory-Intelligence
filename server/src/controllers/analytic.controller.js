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
        ...(outletId && {
          "outlet.outletId": new mongoose.Types.ObjectId(outletId),
        }),
      },
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

  const data = await Sale.aggregate(pipeline);
  return res.status(200).json(new ApiResoponse(200, data, "success"));
});

export const ingredientUsageAndBurnRate = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Unauthorized");
  }

  const tenant = req.user.tenant;
  const { fromDate, toDate, outletId } = req.query;

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

// export const brandAnalyticsDetialedReport = asyncHandler(async (req, res) => {
//   if (req.user.role !== "BRAND_ADMIN") {
//     throw new ApiError(400, "Unauthorized Request ,Only Brand Manager can see the details")
//   }

//   const tenantContext = req.user.tenant
//   const { toDate, fromDate } = req.query;
//   console.log(toDate, fromDate);

//   if (!tenantContext) {
//     throw new ApiError(400, "Unauthorized Request")
//   }

//   const date = new Date(fromDate)
//   const nextDate = new Date(toDate)

//   const result = await Sale.aggregate([
//     {
//       $match: {
//         "tenant.tenantId": tenantContext.tenantId,
//         // "tenant.tenantName": tenantContext.tenantName,
//         createdAt: {
//           $gte: date,
//           $lte: nextDate
//         },
//       },
//     },
//     {
//       $project: {
//         outlet: 1,
//         items: 1,
//         state: 1
//       }
//     },
//     { $unwind: "$items" },
//     {
//       $project: {
//         outlet: 1,
//         sale: "$items.totalAmount",
//         makingCost: "$items.makingCost",
//         state: 1
//       }
//     },
//     {
//       $group: {
//         _id: "$_id",
//         makingCost: {
//           $sum: {
//             $cond: [
//               { $eq: ["$state", "CONFIRMED"] },
//               "$makingCost",
//               0
//             ]
//           }
//         },
//         sale: {
//           $sum: {
//             $cond: [
//               { $eq: ["$state", "CONFIRMED"] },
//               "$sale",
//               0
//             ]
//           }
//         },
//         outlet: { $first: "$outlet" },
//         state: { $first: "$state" }
//       }
//     },
//     {
//       $group: {
//         _id: {
//           outletId: "$outlet.outletId",
//           outletName: "$outlet.outletName",
//         },
//         cogs: { $sum: "$makingCost" },
//         totalSale: { $sum: "$sale" },
//         totalConfirmOrder: {
//           $sum: {
//             $cond: [
//               { $eq: ["$state", "CONFIRMED"] },
//               1,
//               0
//             ]
//           }
//         },
//         totalBillCanceled: {
//           $sum: {
//             $cond: [
//               { $eq: ["$state", "CANCELED"] },
//               1,
//               0
//             ]
//           }
//         }
//       }
//     },


//     {
//       $project: {
//         outlet: "$_id",
//         cogs: 1,
//         totalSale: 1,
//         totalConfirmOrder: 1,
//         totalBillCanceled: 1,
//         totalProfit: { $subtract: ["$totalSale", "$cogs"] },
//         _id: 0
//       }
//     },

//     {
//       $facet: {
//         outletData: [{ $match: {} }],
//         brandTotal: [
//           {
//             $group: {
//               _id: null,
//               brandTotalSale: { $sum: "$totalSale" }
//             }
//           }
//         ]
//       }
//     },

//     {
//       $project: {
//         outletData: 1,
//         brandTotalSale: {
//           $ifNull: [{ $arrayElemAt: ["$brandTotal.brandTotalSale", 0] }, 0]
//         }
//       }
//     },

//     {
//       $unwind: "$outletData"
//     },

//     {
//       $project: {
//         outlet: "$outletData.outlet",
//         cogs: "$outletData.cogs",
//         totalSale: "$outletData.totalSale",
//         totalOrder: "$outletData.totalConfirmOrder",
//         totalBillCanceled: "$outletData.totalBillCanceled",
//         totalProfit: "$outletData.totalProfit",

//         averagePerOrder: {
//           $cond: [
//             { $gt: ["$outletData.totalConfirmOrder", 0] },
//             { $round: [{ $divide: ["$outletData.totalSale", "$outletData.totalConfirmOrder"] }, 2] },
//             0
//           ]
//         },

//         cancelRate: {
//           $cond: [
//             { $gt: ["$outletData.totalConfirmOrder", 0] },
//             {
//               $round: [
//                 {
//                   $multiply: [
//                     { $divide: ["$outletData.totalBillCanceled",{ $sum : ["$outletData.totalConfirmOrder","$outletData.totalBillCanceled"]}] },
//                     100
//                   ]
//                 },
//                 2
//               ]
//             },
//             0
//           ]
//         },

//         profitMargin: {
//           $cond: [
//             { $gt: ["$outletData.totalSale", 0] },
//             {
//               $round: [
//                 {
//                   $multiply: [
//                     { $divide: ["$outletData.totalProfit", "$outletData.totalSale"] },
//                     100
//                   ]
//                 },
//                 2
//               ]
//             },
//             0
//           ]
//         },

//         revenueContribution: {
//           $cond: [
//             { $gt: ["$brandTotalSale", 0] },
//             {
//               $round: [
//                 {
//                   $multiply: [
//                     { $divide: ["$outletData.totalSale", "$brandTotalSale"] },
//                     100
//                   ]
//                 },
//                 2
//               ]
//             },
//             0
//           ]
//         }


//       }
//     }
//   ])

//   return res.status(200).json(
//     new ApiResoponse(200, result, "successfull")
//   )
// })

export const brandAnalyticsDetialedReport = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403, "Unauthorized Request");
  }

  const tenantContext = req.user.tenant;
  const { fromDate, toDate } = req.query;

  if (!tenantContext) {
    throw new ApiError(403, "Unauthorized Request");
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  // Normalize range
  const snapshotStart = new Date(from.setUTCHours(0, 0, 0, 0));
  const snapshotEnd = new Date(to.setUTCHours(23, 59, 59, 999));

  // Today's live data start
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const pipeline = [

    /* ---------- SNAPSHOT DATA ---------- */

    {
      $match: {
        tenantId: tenantContext.tenantId,
        date: { $gte: snapshotStart, $lte: snapshotEnd }
      }
    },

    {
      $project: {
        outletId: 1,
        outletName: 1,
        totalSale: 1,
        confirmedOrders: 1,
        canceledOrders: 1,
        cogs: 1
      }
    },

    /* ---------- UNION LIVE DATA ---------- */

    {
      $unionWith: {
        coll: "sales",
        pipeline: [

          {
            $match: {
              "tenant.tenantId": tenantContext.tenantId,
              createdAt: { $gte: todayStart }
            }
          },

          { $project: { outlet: 1, items: 1, state: 1 } },
          { $unwind: "$items" },

          {
            $project: {
              outlet: 1,
              sale: "$items.totalAmount",
              makingCost: "$items.makingCost",
              state: 1
            }
          },

          {
            $group: {
              _id: "$_id",
              sale: {
                $sum: {
                  $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0]
                }
              },
              makingCost: {
                $sum: {
                  $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$makingCost", 0]
                }
              },
              outlet: { $first: "$outlet" },
              state: { $first: "$state" }
            }
          },

          {
            $group: {
              _id: {
                outletId: "$outlet.outletId",
                outletName: "$outlet.outletName"
              },
              totalSale: { $sum: "$sale" },
              cogs: { $sum: "$makingCost" },
              confirmedOrders: {
                $sum: { $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0] }
              },
              canceledOrders: {
                $sum: { $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0] }
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
        ]
      }
    },

    /* ---------- MERGE SNAPSHOT + LIVE ---------- */

    {
      $group: {
        _id: {
          outletId: "$outletId",
          outletName: "$outletName"
        },
        totalSale: { $sum: "$totalSale" },
        confirmedOrders: { $sum: "$confirmedOrders" },
        canceledOrders: { $sum: "$canceledOrders" },
        cogs: { $sum: "$cogs" }
      }
    },

    /* ---------- COMPUTE PER OUTLET KPIs ---------- */

    {
      $project: {
        outlet: {
          outletId: "$_id.outletId",
          outletName: "$_id.outletName"
        },

        cogs: 1,
        totalSale: 1,
        totalOrder: "$confirmedOrders",
        totalBillCanceled: "$canceledOrders",

        totalProfit: { $subtract: ["$totalSale", "$cogs"] },

        averagePerOrder: {
          $cond: [
            { $gt: ["$confirmedOrders", 0] },
            { $round: [{ $divide: ["$totalSale", "$confirmedOrders"] }, 2] },
            0
          ]
        },

        cancelRate: {
          $cond: [
            { $gt: [{ $add: ["$confirmedOrders", "$canceledOrders"] }, 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$canceledOrders",
                        { $add: ["$confirmedOrders", "$canceledOrders"] }
                      ]
                    },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        },

        profitMargin: {
          $cond: [
            { $gt: ["$totalSale", 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ["$totalSale", "$cogs"] },
                        "$totalSale"
                      ]
                    },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }
      }
    },

    /* ---------- BRAND TOTAL ---------- */

    {
      $facet: {
        outletData: [{ $match: {} }],
        brandTotal: [
          {
            $group: {
              _id: null,
              brandTotalSale: { $sum: "$totalSale" }
            }
          }
        ]
      }
    },

    {
      $project: {
        outletData: 1,
        brandTotalSale: {
          $ifNull: [{ $arrayElemAt: ["$brandTotal.brandTotalSale", 0] }, 0]
        }
      }
    },

    {
      $unwind: "$outletData"
    },

    /* ---------- FINAL SHAPE MATCHING OLD API ---------- */

    {
      $project: {
        outlet: "$outletData.outlet",
        cogs: "$outletData.cogs",
        totalSale: "$outletData.totalSale",
        totalOrder: "$outletData.totalOrder",
        totalBillCanceled: "$outletData.totalBillCanceled",
        totalProfit: "$outletData.totalProfit",
        averagePerOrder: "$outletData.averagePerOrder",
        cancelRate: "$outletData.cancelRate",
        profitMargin: "$outletData.profitMargin",

        revenueContribution: {
          $cond: [
            { $gt: ["$brandTotalSale", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$outletData.totalSale", "$brandTotalSale"] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }
      }
    }
  ];

  const result = await TenantDailySnapshot.aggregate(pipeline);

  return res.status(200).json(
    new ApiResoponse(200, result, "successfull")
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
        items: [{ $project: { _id: 0, itemId: "$_id", itemName: 1, qty: 1, profit: 1 } }],
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
                          { $gte: ["$$i.qty", { $arrayElemAt: ["$stats.avgQty", 0] }] },
                          { $gte: ["$$i.profit", { $arrayElemAt: ["$stats.avgProfit", 0] }] },
                        ],
                      },
                      then: "STAR",
                    },
                    {
                      case: {
                        $and: [
                          { $lt: ["$$i.qty", { $arrayElemAt: ["$stats.avgQty", 0] }] },
                          { $gte: ["$$i.profit", { $arrayElemAt: ["$stats.avgProfit", 0] }] },
                        ],
                      },
                      then: "PUZZLE",
                    },
                    {
                      case: {
                        $and: [
                          { $gte: ["$$i.qty", { $arrayElemAt: ["$stats.avgQty", 0] }] },
                          { $lt: ["$$i.profit", { $arrayElemAt: ["$stats.avgProfit", 0] }] },
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
  ]);

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
