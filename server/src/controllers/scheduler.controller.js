import SchedulerLog from "../models/schedulerLog.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResoponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSchedulerLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    eventType,
    startDate,
    endDate,
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  if (pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, "Page and limit must be positive numbers");
  }

  const query = {};

  if (status) {
    query.status = status;
  }

  if (eventType) {
    query.eventType = eventType;
  }

  if (startDate && isNaN(new Date(startDate))) {
    throw new ApiError(400, "Invalid startDate format");
  }

  if (endDate && isNaN(new Date(endDate))) {
    throw new ApiError(400, "Invalid endDate format");
  }

  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const logs = await SchedulerLog.find(query)
    .sort({ startTime: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await SchedulerLog.countDocuments(query);

  return res.status(200).json(
    new ApiResoponse(200, {
      logs,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
    "Scheduler logs fetched successfully")
  );
});
