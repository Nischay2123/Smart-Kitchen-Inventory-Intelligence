import mongoose from "mongoose";
import Sale from "../models/sale.model.js"
import StockMovement from "../models/stockMovement.model.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

export const itemsProfitPerDeployement = asyncHandler(async(req,res)=>{
    // console.log(req.user.role);
    
    if (req.user.role !== "BRAND_ADMIN") {
        throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
    }
    const tenantContext = req.user.tenant
    const {toDate , fromDate , outletId} = req.query;
    
    if (!tenantContext) {
        throw new ApiError(400,"Unauthorized Request")
    }
    
    
    const outletObjectId = new mongoose.Types.ObjectId(outletId)
    
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
                "outlet.outletId":outletObjectId,
                state:"CONFIRMED"
            }
        },
        {
            $project:{
                _id:0,
                items:1,
                outlet:1
            }
        },
        {
            $unwind: "$items",
        },
        {
            $group: {
                _id:   { 
                    itemId:"$items.itemId",
                },
                outlet:{$first:"$outlet"},
                itemName: { $first: "$items.itemName" },
                totalQty: { $sum: "$items.qty" },
                totalRevenue: { $sum: "$items.totalAmount" },
                totalMakingCost: { $sum: "$items.makingCost" },
            },
        },
        {
            $project: {
                _id: 0,
                itemId: "$_id.itemId",
                outlet: "$outlet",
                itemName: 1,
                totalQty: 1,
                totalRevenue: 1,
                totalMakingCost: 1,
                profit: {
                    $subtract: ["$totalRevenue", "$totalMakingCost"],
                },
            },
        },
    ])


    return res.status(200).json(
        new ApiResoponse(200,result,"successfull")
    )

})



export const ingredientDetialsPerDeployement = asyncHandler(async(req,res)=>{
    if (req.user.role !== "BRAND_ADMIN") {
        throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
    }
    const tenantContext = req.user.tenant
    const {toDate , fromDate , outletId} = req.query;
    
    if (!tenantContext) {
        throw new ApiError(400,"Unauthorized Request")
    }
    
    
    const outletObjectId = new mongoose.Types.ObjectId(outletId)
    
    const date = new Date(fromDate)
    const nextDate = new Date(toDate )

    const result = await StockMovement.aggregate([
        {
            $match:{
                "tenant.tenantId":tenantContext.tenantId,
                "tenant.tenantName":tenantContext.tenantName,
                createdAt:{
                    $gte:date,
                    $lte:nextDate
                },
                "outlet.outletId":outletObjectId,
                reason:"ORDER"
            },
        },
        {
            $project:{
                _id:0,
                ingredient:1,
                quantity:1,
                unit:1,
                orderId:1
            }
        },
        {
            $group:{
                _id:{
                    ingredient:{
                        ingredientId:"$ingredient.ingredientMasterId",
                        ingredientName:"$ingredient.ingredientMasterName"                 
                    }
                },
                totalQty:{$sum:"$quantity"},
                noOfOrders:{$sum:1},
                unit:{$first:"$unit"}
            }
        },
        {
            $project:{
                _id:0,
                ingredient:"$_id.ingredient",
                totalQty:1,
                unit:1,
                noOfOrders:1
            }
        }
    ])

    return res.status(200).json(
        new ApiResoponse(200,result,"successfull")
    )
})

export const brandAnalyticsDetialedReport = asyncHandler(async(req,res)=>{
    if (req.user.role !== "BRAND_ADMIN") {
        throw new ApiError(400,"Unauthorized Request ,Only Brand Manager can see the details")
    }
    const tenantContext = req.user.tenant
    const {toDate , fromDate } = req.query;
    
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
        {
            $unwind:{path:"$items"}
        },
        {
            $project:{
                outlet:1,
                sale:"$items.totalAmount",
                makingCost:"$items.makingCost",
                state:1,
                outlet:1,    
            }
        },
        {
            $group:{
                _id:"$_id",
                makingCost:{
                    $sum:{
                        $cond:{
                            if:{$eq:["$state","CONFIRMED"]},
                            then:"$makingCost",
                            else:0
                        }
                    }
                },
                sale:{
                    $sum:{
                        $cond:{
                            if:{$eq:["$state","CONFIRMED"]},
                            then:"$sale",
                            else:0
                        }
                    }
                },
                outlet:{$first:"$outlet"},
                state:{$first:"$state"}
            }
        },
        {
            $group:{
                _id:{
                    outletId:"$outlet.outletId",
                    outletName:"$outlet.outletName",
                },
                cogs:{$sum:"$makingCost"},
                totalSale:{$sum:"$sale"},
                totalOrder:{$sum:1},
                totalBillCanceled:{
                    $sum:{
                        $cond:{
                            if:{$eq:["$state","CONFIRMED"]},
                            then:0,
                            else:1
                        }
                    }
                }
            }
        },
        {
            $project:{
                _id:0,
                outlet:"$_id",
                cogs:1,
                totalSale:1,
                totalOrder:1,
                totalBillCanceled:1,
                totalProfit:{$subtract:["$totalSale","$cogs"]},
                averagePerCover: {
                    $cond: [
                        { $gt: ["$totalOrder", 0] },
                        { $round: [{ $divide: ["$totalSale", "$totalOrder"] }, 2] },
                        0
                    ]
                },
            }
        }
    ])

    return res.status(200).json(
        new ApiResoponse(200,result,"successfull")
    )
})