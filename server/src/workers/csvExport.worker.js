import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Sale from "../models/sale.model.js";
import config from "../utils/config.js";
import { sendMenuItemExportEmail } from "../utils/emailAlert.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("[csvExport.worker] MongoDB connected");
    } catch (err) {
        console.error("[csvExport.worker] MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

connectDB();

const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

const s3 = new S3Client({
    region: config.AWS.REGION,
    credentials: {
        accessKeyId: config.AWS.ACCESS_KEY_ID,
        secretAccessKey: config.AWS.SECRET_ACCESS_KEY,
    },
});

function arrayToCSV(rows) {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = rows.map((row) =>
        headers.map((h) => {
            const val = row[h] ?? "";
            // Escape commas / quotes
            return typeof val === "string" && (val.includes(",") || val.includes('"'))
                ? `"${val.replace(/"/g, '""')}"`
                : val;
        }).join(",")
    );
    return [headers.join(","), ...lines].join("\n");
}

async function fetchProfitData({ tenantId, outletId, fromDate, toDate }) {
    return Sale.aggregate(
        [
            {
                $match: {
                    "tenant.tenantId": new mongoose.Types.ObjectId(tenantId),
                    state: "CONFIRMED",
                    createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
                    "outlet.outletId": new mongoose.Types.ObjectId(outletId),
                },
            },
            { $project: { items: 1 } },
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
                    itemName: 1,
                    totalQty: 1,
                    totalRevenue: 1,
                    totalMakingCost: { $round: ["$totalMakingCost", 2] },
                    profit: {
                        $round: [{ $subtract: ["$totalRevenue", "$totalMakingCost"] }, 2],
                    },
                    profitMargin: {
                        $round: [
                            {
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
                            2,
                        ],
                    },
                },
            },
        ],
        { allowDiskUse: true }
    );
}

async function fetchMenuMatrixData({ tenantId, fromDate, toDate }) {
    const result = await Sale.aggregate(
        [
            {
                $match: {
                    "tenant.tenantId": new mongoose.Types.ObjectId(tenantId),
                    createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
                    state: "CONFIRMED",
                },
            },
            { $project: { items: 1 } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.itemId",
                    itemName: { $first: "$items.itemName" },
                    qty: { $sum: "$items.qty" },
                    profit: {
                        $sum: { $subtract: ["$items.totalAmount", "$items.makingCost"] },
                    },
                },
            },
            {
                $facet: {
                    stats: [{ $group: { _id: null, avgQty: { $avg: "$qty" }, avgProfit: { $avg: "$profit" } } }],
                    items: [{ $project: { _id: 0, itemName: 1, qty: 1, profit: { $round: ["$profit", 2] } } }],
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
                                itemName: "$$i.itemName",
                                qty: "$$i.qty",
                                profit: "$$i.profit",
                                category: {
                                    $switch: {
                                        branches: [
                                            {
                                                case: { $and: [{ $gte: ["$$i.qty", "$avgQty"] }, { $gte: ["$$i.profit", "$avgProfit"] }] },
                                                then: "STAR",
                                            },
                                            {
                                                case: { $and: [{ $lt: ["$$i.qty", "$avgQty"] }, { $gte: ["$$i.profit", "$avgProfit"] }] },
                                                then: "PUZZLE",
                                            },
                                            {
                                                case: { $and: [{ $gte: ["$$i.qty", "$avgQty"] }, { $lt: ["$$i.profit", "$avgProfit"] }] },
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
        ],
        { allowDiskUse: true }
    );
    return result[0]?.items ?? [];
}

export const csvExportWorker = new Worker(
    "csv-export",
    async (job) => {
        const { reportType, tenantId, outletId, outletName, fromDate, toDate, userEmail, userName } = job.data;

        console.log(`[csvExport.worker] Processing job ${job.id} | type=${reportType}`);

        let rows;
        if (reportType === "profit") {
            rows = await fetchProfitData({ tenantId, outletId, fromDate, toDate });
        } else {
            rows = await fetchMenuMatrixData({ tenantId, fromDate, toDate });
        }

        const csvContent = arrayToCSV(rows);
        const fileName = `reports/${reportType}_${tenantId}_${fromDate}_${toDate}_${Date.now()}.csv`;

        await s3.send(
            new PutObjectCommand({
                Bucket: config.AWS.S3_BUCKET,
                Key: fileName,
                Body: csvContent,
                ContentType: "text/csv",
            })
        );

        const downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: config.AWS.S3_BUCKET, Key: fileName }),
            { expiresIn: 7 * 24 * 60 * 60 }
        );

        await sendMenuItemExportEmail({ to: userEmail, userName, outletName, fromDate, toDate, reportType, downloadUrl });

        console.log(`[csvExport.worker] Job ${job.id} completed. Email sent to ${userEmail}`);
    },
    {
        connection,
        concurrency: 2,
    }
);

csvExportWorker.on("failed", (job, err) => {
    console.error(`[csvExport.worker] Job ${job?.id} failed:`, err.message);
});
