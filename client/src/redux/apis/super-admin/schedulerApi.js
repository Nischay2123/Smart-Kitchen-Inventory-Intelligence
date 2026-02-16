import { baseApi } from "../baseApi";

export const StockMovement = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSchedulerLogs: builder.query({
            query: ({ page = 1, limit = 20, status, eventType }) => ({
                url: "/scheduler-logs",
                params: { page, limit, status, eventType },
            }),
            providesTags: ["SchedulerLogs"],
        }),
    }),
})

export const {
    useGetSchedulerLogsQuery
} = StockMovement;