import { baseApi } from "../baseApi";

export const StockMovement = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSchedulerLogs: builder.query({
            query: ({ page = 1, limit = 20, status, eventType, startDate, endDate }) => ({
                url: "/scheduler-logs",
                params: { page, limit, status, eventType, startDate, endDate },
            }),
            providesTags: ["SchedulerLogs"],
        }),
    }),
})

export const {
    useGetSchedulerLogsQuery
} = StockMovement;