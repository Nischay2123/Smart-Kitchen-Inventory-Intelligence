import SchedulerLog from "../models/schedulerLog.model.js";

export const getSchedulerLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, eventType, startDate, endDate } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }
        if (eventType) {
            query.eventType = eventType;
        }
        if (startDate && endDate) {
            query.startTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        } else if (startDate) {
            query.startTime = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.startTime = { $lte: new Date(endDate) };
        }

        const logs = await SchedulerLog.find(query)
            .sort({ startTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await SchedulerLog.countDocuments(query);

        res.status(200).json({
            success: true,
            data: logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
