import mongoose from "mongoose";
import dotenv from "dotenv";
import TenantDailySnapshot from "../../server/src/models/tenantDailySnapshot.model.js";

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



