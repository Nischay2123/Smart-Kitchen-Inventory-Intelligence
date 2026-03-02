import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { PassThrough } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { format as csvFormat } from "fast-csv";
import config from "../utils/config.js";
import { sendMenuItemExportEmail, sendMenuItemExportErrorEmail } from "../utils/emailAlert.js";
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

export const csvExportWorker = new Worker(
    "csv-export",
    async (job) => {
        const { reportType, tenantId, outletId, outletName, fromDate, toDate, userEmail, userName } = job.data;

        console.log(`[csvExport.worker] Processing job ${job.id} | type=${reportType}`);

        const fileName = `reports/${reportType}_${tenantId}_${fromDate}_${toDate}_${Date.now()}.csv`;

        const passThrough = new PassThrough();

        const csvStream = csvFormat({ headers: true, writeBOM: true });
        csvStream.pipe(passThrough);

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: config.AWS.S3_BUCKET,
                Key: fileName,
                Body: passThrough,
                ContentType: "text/csv",
            },
        });

        try {
            for await (const row of generateReportRows({ reportType, tenantId, outletId, fromDate, toDate })) {
                if (!csvStream.write(row)) {
                    await new Promise((resolve) => csvStream.once("drain", resolve));
                }
            }
        } finally {
            csvStream.end();
        }

        await upload.done();
        console.log(`[csvExport.worker] S3 upload complete: ${fileName}`);

        const downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: config.AWS.S3_BUCKET, Key: fileName }),
            { expiresIn: 7 * 24 * 60 * 60 }
        );

        await sendMenuItemExportEmail({ to: userEmail, userName, outletName, fromDate, toDate, reportType, downloadUrl });

        console.log(`[csvExport.worker] Job ${job.id} done. Email sent to ${userEmail}`);
    },
    {
        connection,
        concurrency: 2,
    }
);

csvExportWorker.on("failed", async (job, err) => {
    console.error(`[csvExport.worker] Job ${job?.id} failed:`, err.message);

    if (!job?.data) return;
    const { userEmail, userName, outletName, fromDate, toDate, reportType } = job.data;

    await sendMenuItemExportErrorEmail({
        to: userEmail,
        userName,
        outletName,
        fromDate,
        toDate,
        reportType,
        err,
    });
});
