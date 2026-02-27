import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../utils/config.js";
import { sendMenuItemExportEmail } from "../utils/emailAlert.js";
import { generateReportRows } from "../proccessors/csvExport.processor.js";

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
            return typeof val === "string" && (val.includes(",") || val.includes('"'))
                ? `"${val.replace(/"/g, '""')}"`
                : val;
        }).join(",")
    );
    return [headers.join(","), ...lines].join("\n");
}

export const csvExportWorker = new Worker(
    "csv-export",
    async (job) => {
        const { reportType, tenantId, outletId, outletName, fromDate, toDate, userEmail, userName } = job.data;

        console.log(`[csvExport.worker] Processing job ${job.id} | type=${reportType}`);

        const rows = await generateReportRows({ reportType, tenantId, outletId, fromDate, toDate });

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
