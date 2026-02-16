import SchedulerLog from "../models/schedulerLog.model.js";

export const getSchedulerLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, eventType } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }
        if (eventType) {
            query.eventType = eventType;
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
