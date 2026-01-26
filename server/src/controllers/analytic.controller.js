import mongoose from "mongoose";
import Sale from "../models/sale.model.js"
import StockMovement from "../models/stockMovement.model.js"
import Outlet from "../models/outlet.model.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

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



export const ingredientUsageAndBurnRate = asyncHandler(async(req,res)=>{
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(403,"Unauthorized")
  }

  const tenant = req.user.tenant
  const { fromDate, toDate, outletId } = req.query;

  const match = {
    "tenant.tenantId": tenant.tenantId,
    reason: "ORDER",
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  }

  if (outletId) {
    match["outlet.outletId"] = new mongoose.Types.ObjectId(outletId)
  }

  const data = await StockMovement.aggregate([
    { $match: match },

    {
      $lookup: {
        from: "stocks",
        localField: "stockId",
        foreignField: "_id",
        as: "stock"
      }
    },
    { $unwind: "$stock" },

    {
      $group: {
        _id: "$ingredient.ingredientMasterId",
        ingredientName: { $first: "$ingredient.ingredientMasterName" },
        totalQty: { $sum: "$quantity" },
        unit: { $first: "$unit" },
        noOfOrders: { $sum: 1 },
        totalCost: {
          $sum: { $multiply: ["$quantity", "$stock.unitCost"] }
        }
      }
    },

    {
      $project: {
        _id: 0,
        ingredientId: "$_id",
        ingredientName: 1,
        totalQty: 1,
        unit: 1,
        noOfOrders: 1,
        totalCost: 1,
        avgQtyPerOrder: {
          $cond:[
            { $gt:["$noOfOrders",0] },
            { $round:[ { $divide:["$totalQty","$noOfOrders"] },2 ] },
            0
          ]
        },
        avgCostPerOrder: {
          $cond:[
            { $gt:["$noOfOrders",0] },
            { $round:[ { $divide:["$totalCost","$noOfOrders"] },2 ] },
            0
          ]
        }
      }
    }
  ])

  return res.status(200).json(
    new ApiResoponse(200,data,"success")
  )
})

export const brandAnalyticsDetialedReport = asyncHandler(async(req,res)=>{
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
  }

  const tenantContext = req.user.tenant
  const {toDate , fromDate } = req.query;
  console.log(toDate,fromDate);
  
  if (!tenantContext) {
    throw new ApiError(400,"Unauthorized Request")
  }

  const date = new Date(fromDate)
  const nextDate = new Date(toDate )

  const result = await Sale.aggregate([
    {
      $match:{
        "tenant.tenantId":tenantContext.tenantId,
        "tenant.tenantName":tenantContext.tenantName,
        createdAt:{
          $gte:date,
          $lte:nextDate
        },
      },
    },
    {
      $project:{
        outlet:1,
        items:1,
        state:1
      }
    },
    { $unwind:"$items" },
    {
      $project:{
        outlet:1,
        sale:"$items.totalAmount",
        makingCost:"$items.makingCost",
        state:1
      }
    },
    {
      $group:{
        _id:"$_id",
        makingCost:{
          $sum:{
            $cond:[
              { $eq:["$state","CONFIRMED"] },
              "$makingCost",
              0
            ]
          }
        },
        sale:{
          $sum:{
            $cond:[
              { $eq:["$state","CONFIRMED"] },
              "$sale",
              0
            ]
          }
        },
        outlet:{ $first:"$outlet" },
        state:{ $first:"$state" }
      }
    },
    {
      $group:{
        _id:{
          outletId:"$outlet.outletId",
          outletName:"$outlet.outletName",
        },
        cogs:{ $sum:"$makingCost" },
        totalSale:{ $sum:"$sale" },
        totalOrder:{
          $sum:{
            $cond:[
              { $eq:["$state","CONFIRMED"] },
              1,
              0
            ]
          }
        },
        totalBillCanceled:{
          $sum:{
            $cond:[
              { $eq:["$state","CONFIRMED"] },
              0,
              1
            ]
          }
        }
      }
    },

    /* ---------------- ADDITION START ---------------- */

    {
      $project:{
        outlet:"$_id",
        cogs:1,
        totalSale:1,
        totalOrder:1,
        totalBillCanceled:1,
        totalProfit:{ $subtract:["$totalSale","$cogs"] },
        _id:0
      }
    },

    {
      $facet:{
        outletData:[ { $match:{} } ],
        brandTotal:[
          {
            $group:{
              _id:null,
              brandTotalSale:{ $sum:"$totalSale" }
            }
          }
        ]
      }
    },

    {
      $project:{
        outletData:1,
        brandTotalSale:{
          $ifNull:[ { $arrayElemAt:["$brandTotal.brandTotalSale",0] }, 0 ]
        }
      }
    },

    {
      $unwind:"$outletData"
    },

    {
      $project:{
        outlet:"$outletData.outlet",
        cogs:"$outletData.cogs",
        totalSale:"$outletData.totalSale",
        totalOrder:"$outletData.totalOrder",
        totalBillCanceled:"$outletData.totalBillCanceled",
        totalProfit:"$outletData.totalProfit",

        averagePerCover:{
          $cond:[
            { $gt:["$outletData.totalOrder",0] },
            { $round:[ { $divide:["$outletData.totalSale","$outletData.totalOrder"] },2 ] },
            0
          ]
        },

        /* ---------- NEW KPIs ---------- */

        cancelRate:{
          $cond:[
            { $gt:["$outletData.totalOrder",0] },
            {
              $round:[
                { 
                  $multiply:[
                    { $divide:["$outletData.totalBillCanceled","$outletData.totalOrder"] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        },

        profitMargin:{
          $cond:[
            { $gt:["$outletData.totalSale",0] },
            {
              $round:[
                {
                  $multiply:[
                    { $divide:["$outletData.totalProfit","$outletData.totalSale"] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        },

        revenueContribution:{
          $cond:[
            { $gt:["$brandTotalSale",0] },
            {
              $round:[
                {
                  $multiply:[
                    { $divide:["$outletData.totalSale","$brandTotalSale"] },
                    100
                  ]
                },
                2
              ]
            },
            0
          ]
        }

        /* ---------------- END ---------------- */

      }
    }
  ])

  return res.status(200).json(
    new ApiResoponse(200,result,"successfull")
  )
})

export const menuEngineeringMatrix = asyncHandler(async (req, res) => {
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
  }

   const tenantContext = req.user.tenant
    const {toDate , fromDate } = req.query;
    // console.log(tenantContext,toDate,fromDate);
    
    if (!tenantContext) {
        throw new ApiError(400,"Unauthorized Request")
    }
    
  const data = await Sale.aggregate([
    {
      $match: {
        "tenant.tenantId": tenantContext.tenantId,
        state: "CONFIRMED",
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
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


export const getOutlets= asyncHandler(async(req,res)=>{
  if (req.user.role !== "BRAND_ADMIN") {
    throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
  }
  const tenantContext = req.user.tenant;
  const outlets = await Outlet.find({
    "tenant.tenantId": tenantContext.tenantId
  }).select("tenant outletName")

  if (!outlets) {
    throw new ApiError(200,[],`No Outlet found for the Brand: ${tenantContext.tenantName}`)
  }

  return res.status(200).json(
    new ApiResoponse(200,outlets,"Oulets Fetched Successfully")
  )
})
