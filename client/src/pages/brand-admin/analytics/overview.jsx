import { useState } from "react";
import { useSelector } from "react-redux";
import AnalyticsHeader from "@/components/AnalyticsHeader";
import TabSalesBarChart from "@/components/charts/bar-chart";
import DataCard from "@/components/data-card/data-card";
import { AnalyticsCards, SecondaryMetrics } from "@/components/site-card/site-cards";
import { useGetDeploymentDataQuery } from "@/redux/apis/brand-admin/analyticsApi";
import { aggregateData } from "@/utils/analyitcs/overviewUtil";

const outletColumns = [
  {
    accessorKey: "outlet.outletName",
    header: "Outlet",
  },
  {
    accessorKey: "totalSale",
    header: "Total Sale",
    cell: ({ row }) => (
      <span className="text-muted-foreground">₹{row.original.totalSale}</span>
    ),
  },
  {
    accessorKey: "revenueContribution",
    header: "Revenue Contribution",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.revenueContribution}%</span>
    ),
  },
];

export const Overview = () => {
  const { from, to } = useSelector((state) => state.dashboardFilters.dateRange);
  const { data, isLoading, isError, refetch } = useGetDeploymentDataQuery(
    { from, to },
    { skip: !from || !to }
  );

  const aggregated = aggregateData(data?.data);

  const [focusedDeployment, setFocusedDeployment] = useState(null);

  const displayedData = focusedDeployment ?? aggregated;

  const handleRowClick = (row) => {
    setFocusedDeployment((prev) =>
      prev?.outlet?.outletId === row.outlet.outletId ? null : row
    );
  };

  const headerText = focusedDeployment
    ? `Showing data for outlet: ${focusedDeployment.outlet.outletName}`
    : "Showing aggregated data across all outlets";

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        onRefresh={refetch}
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
            data={data?.data ?? []}
            xKey="outlet.outletName"
            yKey="totalSale"
            onBarClick={() => {}}
            loading={isLoading}
          />

          <DataCard
            description="Per outlet sales and contribution"
            title={"Outlet Data"}
            data={data?.data ?? []}
            columns={outletColumns}
            loading={isLoading}
            onRowClick={handleRowClick}
          />
        </div>
      </section>
    </div>
  );
};
