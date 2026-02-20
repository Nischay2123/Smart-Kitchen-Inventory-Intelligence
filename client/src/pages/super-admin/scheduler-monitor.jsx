import React, { useState } from "react";
import SiteHeader from "@/components/site-header";
import { useGetSchedulerLogsQuery } from "@/redux/apis/super-admin/schedulerApi";
import DataCard from "@/components/data-card/data-card";
import { schedulerLogColumns } from "@/utils/columns/super-admin";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SkeletonLoader } from "@/components/laoder";
import DashboardDateRangePicker from "@/components/data-range-picker";
import { useDispatch, useSelector } from "react-redux";
import { setDateRange } from "@/redux/reducers/brand-admin/dashboardFilters";

const SchedulerMonitor = () => {
    const dispatch = useDispatch();
    const { dateRange } = useSelector((state) => state.dashboardFilters);

    const [page, setPage] = useState({
        pageIndex: 0,
        pageSize: 20
    });
    const [status, setStatus] = useState("all");
    const [eventType, setEventType] = useState("all");

    const queryParams = {
        page: page.pageIndex + 1,
        limit: page.pageSize,
        ...(status !== "all" && { status }),
        ...(eventType !== "all" && { eventType }),
        startDate: dateRange?.from,
        endDate: dateRange?.to,
    };

    const { data, isLoading, isError, isFetching, refetch } = useGetSchedulerLogsQuery(queryParams, {
        skip: !dateRange?.from || !dateRange?.to,
    });

    const logs = data?.data?.logs || [];
    const totalPages = data?.data?.totalPages || 0;

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <SiteHeader
                headerTitle="Scheduler Monitor"
                description="Monitor system cron jobs and background workers"
                isTooltip={false}
                isRefetch={true}
                onRefetch={refetch}
                isFetching={isFetching}
            >
                <div className="flex gap-2 items-end">
                    <DashboardDateRangePicker
                        value={dateRange}
                        onChange={(range) => dispatch(setDateRange(range))}
                        className="flex-row"
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-45">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="started">Started</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger className="w-45">
                            <SelectValue placeholder="Filter by Event" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="daily-snapshot">Daily Snapshot</SelectItem>
                            <SelectItem value="queue-retry">Queue Retry</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SiteHeader>

            <div className="flex-1 min-h-0 p-4 lg:p-6">
                {isLoading ? (
                    <SkeletonLoader />
                ) : (
                    <DataCard
                        title="SCHEDULER LOGS"
                        description="List of all scheduler events and their statuses"
                        columns={schedulerLogColumns}
                        data={logs}
                        loading={isLoading}
                        manualPagination={true}
                        pageCount={totalPages}
                        onPaginationChange={setPage}
                        paginationState={page}
                        titleWhenEmpty="No logs found"
                        descriptionWhenEmpty="There are no scheduler logs to display."
                    />
                )}

                {isError && <p className="text-red-500 mt-4">Failed to load logs</p>}
            </div>
        </div>
    );
};

export default SchedulerMonitor;
