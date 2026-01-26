import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCcw, Circle } from "lucide-react";

import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import DashboardDateRangePicker from "@/components/data-range-picker";

import {
  setDateRange,
  setOutletId,
  setIsLive,
} from "@/redux/reducers/brand-admin/dashboardFilters";

const AnalyticsHeader = ({
  headerTitle = "Dashboard Overview",
  description = "Real-time aggregated analytics",
  outlets = [],
  onRefresh,
}) => {
  const dispatch = useDispatch();

  const { dateRange, outletId, isLive } = useSelector(
    (state) => state.dashboardFilters
  );

  return (
    <div className="w-full border-b bg-white">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-4 py-4 lg:px-6">
        
        {/* Left Section */}
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold leading-tight lg:text-2xl">
            {headerTitle}
          </h1>
          <span className="text-sm text-muted-foreground">
            {description}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex flex-wrap items-end gap-3">
          
          {/* Date Picker */}
          <DashboardDateRangePicker
            value={dateRange}
            onChange={(range) => dispatch(setDateRange(range))}
            className="flex-row"
          />

          {/* Outlet Selector */}
          <Select
            value={outletId ?? ""}
            onValueChange={(id) => dispatch(setOutletId(id))}
          >
            <SelectTrigger className="w-50 h-9.5">
              <SelectValue placeholder="Select outlet" />
            </SelectTrigger>
            <SelectContent>
              {outlets.map((o) => (
                <SelectItem key={o._id} value={o._id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRefresh}
                  size="icon"
                  variant="outline"
                  className="h-9.5 w-9.5"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Refresh Data
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Live Indicator */}
          <div
            onClick={() => dispatch(setIsLive(!isLive))}
            className="flex items-center gap-2 px-3 h-9.5 border rounded-full text-sm cursor-pointer hover:bg-muted transition"
          >
            <Circle
              className={`h-3 w-3 ${
                isLive
                  ? "fill-green-500 text-green-500 animate-pulse"
                  : "fill-gray-400 text-gray-400"
              }`}
            />
            <span className="text-muted-foreground">
              {isLive ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </header>
    </div>
  );
};

export default React.memo(AnalyticsHeader);
