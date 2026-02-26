import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Sale from "../models/sale.model.js";
import OutletItemDailySnapshot from "../models/outletItemDailySnapshot.model.js";

const startOfDay = (d) => {
    const date = new Date(d);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (d) => {
    const date = new Date(d);
    date.setUTCHours(23, 59, 59, 999);
    return date;
};

const getYesterday = (date) => {
    let d = date ? new Date(date) : new Date();
    if (!date) d.setDate(d.getDate() - 1);
    return startOfDay(d);
};

const buildItemPipeline = (tenantId, start, end) => [
    {
        $match: {
            "tenant.tenantId": tenantId,
            createdAt: { $gte: start, $lte: end },
            state: "CONFIRMED",
        },
    },
    {
        $project: {
            outletId: "$outlet.outletId",
            outletName: "$outlet.outletName",
            items: 1,
            day: {
                $dateTrunc: {
                    date: "$createdAt",
                    unit: "day",
                    timezone: "UTC",
                },
            },
        },
    },
    { $unwind: "$items" },
    {
        $group: {
            _id: {
                day: "$day",
                outletId: "$outletId",
                itemId: "$items.itemId",
            },
            itemName: {$first: "$items.itemName"},
            outletName: {$first: "$outletName"},
            totalQty: { $sum: "$items.qty" },
            totalRevenue: { $sum: "$items.totalAmount" },
            totalMakingCost: { $sum: "$items.makingCost" },
        },
    },
];

export const processDailyItemSnapshot = async (job) => {
    console.log(`Processing item snapshot job ${job.id}`);

    const targetDate = job?.data?.date;
    const yesterday = getYesterday(targetDate);

    try {
        const tenants = await Tenant.find({}).select("_id name").lean();

        for (const tenant of tenants) {

            const lastSnapshot = await OutletItemDailySnapshot
                .findOne({ "tenant.tenantId": tenant._id })
                .sort({ date: -1 })
                .select("date")
                .lean();

            let startDate;

            if (lastSnapshot) {
                startDate = new Date(lastSnapshot.date);
                startDate.setUTCDate(startDate.getUTCDate() + 1);
            } else {
                const firstSale = await Sale.findOne(
                    { "tenant.tenantId": tenant._id },
                    { createdAt: 1 }
                )
                    .sort({ createdAt: 1 })
                    .lean();

                if (!firstSale) continue;

                startDate = startOfDay(firstSale.createdAt);
            }

            if (startDate > yesterday) continue;

            const rangeStart = startOfDay(startDate);
            const rangeEnd = endOfDay(yesterday);

            const itemStats = await Sale.aggregate(
                buildItemPipeline(tenant._id, rangeStart, rangeEnd),
                { allowDiskUse: true }
            );

            if (!itemStats.length) continue;

            const session = await mongoose.startSession();

            try {
                session.startTransaction();

                const itemOps = itemStats.map((row) => ({
                    updateOne: {
                        filter: {
                            "tenant.tenantId": tenant._id,
                            "outlet.outletId": row._id.outletId,
                            "item.itemId": row._id.itemId,
                            date: row._id.day,
                        },
                        update: {
                            $set: {
                                tenant: {
                                    tenantId: tenant._id,
                                    tenantName: tenant.name,
                                },
                                outlet: {
                                    outletId: row._id.outletId,
                                    outletName: row.outletName,
                                },
                                item: {
                                    itemId: row._id.itemId,
                                    itemName: row.itemName, 
                                },
                                date: row._id.day,
                                totalQty: row.totalQty,
                                totalRevenue: row.totalRevenue,
                                totalMakingCost: row.totalMakingCost,
                            },
                        },
                        upsert: true,
                    },
                }));

                await OutletItemDailySnapshot.bulkWrite(itemOps, { session });

                await session.commitTransaction();

                console.log(
                    `Tenant ${tenant._id} item snapshot updated until ${yesterday.toISOString()}`
                );

            } catch (err) {
                await session.abortTransaction();
                console.error(`Tenant ${tenant._id} failed in item snapshot`, err);
            } finally {
                session.endSession();
            }
        }

        console.log("Daily item snapshot processing completed");

    } catch (err) {
        console.error("Daily item snapshot job failed:", err);
        throw err;
    }
};
