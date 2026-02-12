import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Sale from "../models/sale.model.js";
import TenantDailySnapshot from "../models/tenantDailySnapshot.model.js";

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

const buildPipeline = (tenantId, start, end) => [
    {
        $match: {
            "tenant.tenantId": tenantId,
            createdAt: { $gte: start, $lte: end },
        },
    },
    {
        $project: {
            outletId: "$outlet.outletId",
            outletName: "$outlet.outletName",
            state: 1,
            sale: { $sum: "$items.totalAmount" },
            makingCost: { $sum: "$items.makingCost" },
            day: {
                $dateTrunc: {
                    date: "$createdAt",
                    unit: "day",
                    timezone: "UTC",
                },
            },
        },
    },
    {
        $group: {
            _id: {
                day: "$day",
                outletId: "$outletId",
                outletName: "$outletName",
            },
            totalSale: {
                $sum: {
                    $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$sale", 0],
                },
            },
            cogs: {
                $sum: {
                    $cond: [{ $eq: ["$state", "CONFIRMED"] }, "$makingCost", 0],
                },
            },
            confirmedOrders: {
                $sum: {
                    $cond: [{ $eq: ["$state", "CONFIRMED"] }, 1, 0],
                },
            },
            canceledOrders: {
                $sum: {
                    $cond: [{ $eq: ["$state", "CANCELED"] }, 1, 0],
                },
            },
        },
    },
];

export const processDailySnapshot = async (job) => {
    console.log(`Processing snapshot job ${job.id}`);

    const targetDate = job.data.date;
    const yesterday = getYesterday(targetDate);

    try {
        const tenants = await Tenant.find({}).select("_id name").lean();

        for (const tenant of tenants) {

            const lastSnapshot = await TenantDailySnapshot
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

            const stats = await Sale.aggregate(
                buildPipeline(tenant._id, rangeStart, rangeEnd),
                { allowDiskUse: true }
            );

            if (!stats.length) continue;

            const session = await mongoose.startSession();

            try {
                session.startTransaction();

                const ops = stats.map((row) => ({
                    updateOne: {
                        filter: {
                            "tenant.tenantId": tenant._id,
                            "outlet.outletId": row._id.outletId,
                            date: row._id.day,
                        },
                        update: {
                            $set: {
                                tenant: {
                                    tenantId: tenant._id,
                                    tenantName: tenant.name 
                                },
                                outlet: {
                                    outletId: row._id.outletId,
                                    outletName: row._id.outletName
                                },
                                date: row._id.day,
                                totalSale: row.totalSale,
                                confirmedOrders: row.confirmedOrders,
                                canceledOrders: row.canceledOrders,
                                cogs: row.cogs,
                            },
                        },
                        upsert: true,
                    },
                }));

                await TenantDailySnapshot.bulkWrite(ops, { session });

                await session.commitTransaction();

                console.log(
                    `Tenant ${tenant._id} snapshot updated until ${yesterday.toISOString()}`
                );

            } catch (err) {
                await session.abortTransaction();
                console.error(`Tenant ${tenant._id} failed`, err);
            } finally {
                session.endSession();
            }
        }

        console.log("Daily snapshot processing completed");

    } catch (err) {
        console.error("Daily snapshot job failed:", err);
        throw err;
    }
};
