import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import AnalyticsHeader from "@/components/AnalyticsHeader";
import TabSalesBarChart from "@/components/charts/bar-chart";
import DataCard from "@/components/data-card/data-card";
import {
  AnalyticsCards,
  SecondaryMetrics,
} from "@/components/site-card/site-cards";

import {
  useGetLiveDeploymentDataMutation,
  useGetSnapshotDeploymentDataMutation,
} from "@/redux/apis/brand-admin/analyticsApi";

import {
  aggregateData,
  chunkArray,
  mergeAnalytics,
} from "@/utils/analyitcs/overviewUtil";

import { useGetAllOutletsQuery } from "@/redux/apis/brand-admin/outletApi";

const outletColumns = [
  {
    accessorKey: "outletName",
    header: "Outlet",
  },
  {
    accessorKey: "totalSale",
    header: "Total Sale",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        ₹{row.original.totalSale}
      </span>
    ),
  },
  {
    accessorKey: "revenueContribution",
    header: "Revenue Contribution",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.revenueContribution}%
      </span>
    ),
  },
];

export const Overview = () => {
  const { from, to } = useSelector(
    (state) => state.dashboardFilters.dateRange
  );

  const { data: outlets } = useGetAllOutletsQuery();

  const [snapshotApi] = useGetSnapshotDeploymentDataMutation();
  const [liveApi] = useGetLiveDeploymentDataMutation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!outlets?.data || !from || !to) return;

    const load = async () => {
      try {
        setLoading(true);

        const outletIds = outlets.data.map((o) => o._id);
        const batches = chunkArray(outletIds, 250);

        let finalResult = [];

        for (const batch of batches) {
          const snapshot = await snapshotApi({
            outletIds: batch,
            from,
            to,
          }).unwrap();

          const live = await liveApi({
            outletIds: batch,
          }).unwrap();
          console.log(live);
          
          const merged = mergeAnalytics(
            snapshot.data,
            live.data
          );
          // console.log(merged);
          
          finalResult = finalResult.concat(merged);
        }
        console.log("ghjk",finalResult);
        
        setData(finalResult);
      } catch (err) {
        console.error("Analytics loading failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [outlets, from, to]);
  const aggregated = aggregateData(data);

  const [focusedDeployment, setFocusedDeployment] = useState(null);

  const displayedData = focusedDeployment ?? aggregated;

  const handleRowClick = (row) => {
    setFocusedDeployment((prev) =>
      prev?.outletId === row.outletId ? null : row
    );
  };

  const headerText = focusedDeployment
    ? `Showing data for outlet: ${focusedDeployment.outletName}`
    : "Showing aggregated data across all outlets";

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        onRefresh={() => window.location.reload()}
        isOutlet={false}
      />

      <div className="@container/main flex flex-col gap-2 pt-4 pb-4">
        <p className="text-md text-gray-500 px-6">{headerText}</p>
        <AnalyticsCards data={displayedData} />
        <SecondaryMetrics data={displayedData} />
      </div>

      <section>
        <h2 className="mb-4 text-sm text-gray-400 px-4 lg:px-6">
          Outlets Insights: click on a table row to see the outlet data
        </h2>

        <div className="flex flex-col gap-4 px-4 lg:px-6 lg:flex-row">
          <TabSalesBarChart
            title="Top Outlets"
            description="Top performing deployments as per sales"
            data={data ?? []}
            xKey="outletName"
            yKey="totalSale"
            onBarClick={() => {}}
            loading={loading}
          />

          <DataCard
            description="Per outlet sales and contribution"
            title={"Outlet Data"}
            data={data ?? []}
            columns={outletColumns}
            loading={loading}
            onRowClick={handleRowClick}
          />
        </div>
      </section>
    </div>
  );
};
