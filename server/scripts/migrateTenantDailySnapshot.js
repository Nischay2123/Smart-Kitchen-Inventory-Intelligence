// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import TenantDailySnapshot from "../src/models/tenantDailySnapshot.model.js";
// import Tenant from "../src/models/tenant.model.js";

// dotenv.config();

// const migrate = async () => {

//   try {
//     await mongoose.connect("");
//     console.log("Connected to MongoDB");

//     const snapshots = await TenantDailySnapshot.find({
//       $or: [
//         { tenant: { $exists: true } },
//         { outlet: { $exists: true } },
//       ],
//     }).lean();

//     console.log(`Found ${snapshots.length} snapshots to migrate`);

//     // for (const snapshot of snapshots) {
//     //   const update = {};
//     //   const unset = {};

//     //   /* ---------- Tenant Migration ---------- */
//     //   if (snapshot.tenantId && !snapshot.tenant) {
//     //     const tenant = await Tenant.findById(snapshot.tenantId).lean();

//     //     if (tenant) {
//     //       update.tenant = {
//     //         tenantId: tenant._id,
//     //         tenantName: tenant.name,
//     //       };
//     //       unset.tenantId = "";
//     //     } else {
//     //       console.warn(
//     //         `Tenant missing for snapshot ${snapshot._id}`
//     //       );
//     //       continue; // skip invalid record
//     //     }
//     //   }

//     //   /* ---------- Outlet Migration ---------- */
//     //   if (snapshot.outletId && !snapshot.outlet) {
//     //     update.outlet = {
//     //       outletId: snapshot.outletId,
//     //       outletName: snapshot.outletName || "Unknown Outlet",
//     //     };

//     //     unset.outletId = "";
//     //     unset.outletName = "";
//     //   }

//     //   if (Object.keys(update).length === 0) continue;

//     //   await TenantDailySnapshot.collection.updateOne(
//     //     { _id: snapshot._id },
//     //     {
//     //       $set: update,
//     //       $unset: unset,
//     //     }
//     //   );

//     //   console.log(`Migrated ${snapshot._id}`);
//     // }

//     console.log("Migration completed");
//     process.exit(0);
//   } catch (err) {
//     console.error("Migration failed:", err);
//     process.exit(1);
//   }
// };

// migrate();

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import TenantDailySnapshot from "../src/models/tenantDailySnapshot.model.js";

// dotenv.config();

// const migrate = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect("");
//     console.log("Connected to MongoDB");

//     // Count documents before update
//     const beforeCount = await TenantDailySnapshot.countDocuments({ "outlet.outletName": "IndusFlavour NSP" });
//     console.log(`Found ${beforeCount} documents with name "IndusFlavour NSP"`);

//     if (beforeCount === 0) {
//       console.log("No documents to update. Exiting.");
//       process.exit(0);
//     }

//     // Update documents
//     const result = await TenantDailySnapshot.updateMany(
//       { "outlet.outletName": "IndusFlavour NSP" },
//       { $set: { "outlet.outletName": "NSP" } }
//     );

//     console.log(`Modified ${result.modifiedCount} documents`);

//     // Optional: show updated counts grouped by name
//     const grouped = await TenantDailySnapshot.aggregate([
//       { $group: { _id: "$name", count: { $sum: 1 } } },
//       { $sort: { count: -1 } },
//     ]);

//     console.log("Updated grouped counts:");
//     console.table(grouped);

//     process.exit(0);
//   } catch (err) {
//     console.error("Migration failed:", err);
//     process.exit(1);
//   }
// };

// migrate();


import mongoose from "mongoose";
import dotenv from "dotenv";
import TenantDailySnapshot from "../src/models/tenantDailySnapshot.model.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect("");
    console.log("Connected to MongoDB");

    // Example: filter by specific IDs or all docs
    const idsToFind = ["696a2158448eaa44cbb20e3e","6977bc8bce1177f4a76c4cc1","6977bc78ce1177f4a76c4cbf","697750a866bf3e3f6b5c2df6","6977bc4ece1177f4a76c4cbb"]; // add more ids if needed

    // Aggregation: group by name and count
    const results = await TenantDailySnapshot.aggregate([
      { $match: { "outlet.outletId": { $in: idsToFind.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$outlet.outletName", count: { $sum: 1 } } },
      { $sort: { count: -1 } } // optional: sort descending by count
    ]);

    console.log("Grouped counts by name:");
    console.table(results);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

run();



