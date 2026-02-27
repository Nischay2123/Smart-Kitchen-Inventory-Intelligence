import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import AnalyticsHeader from "@/components/AnalyticsHeader";
import ExportBanner from "@/components/export-banner";
import TabSalesBarChart from "@/components/charts/bar-chart";
import DataCard from "@/components/data-card/data-card";
import {
  AnalyticsCards,
  SecondaryMetrics,
} from "@/components/site-card/site-cards";
import { GridLoader, SkeletonLoader } from '@/components/laoder';

import {
  useGetLiveDeploymentDataMutation,
  useGetSnapshotDeploymentDataMutation,
  useRequestReportExportMutation,
} from "@/redux/apis/brand-admin/analyticsApi";

import {
  aggregateData,
  chunkArray,
  mergeAnalytics,
} from "@/utils/analyitcs/overviewUtil";
import noDataAnimation from "@/assets/no-data.json"


import { useGetAllOutletsQuery } from "@/redux/apis/brand-admin/outletApi";
import Lottie from "lottie-react";

const isOver30Days = (from, to) => {
  if (!from || !to) return false;
  return (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) > 30;
};

const isTodayInRange = (from, to) => {
  const today = new Date();

  const f = new Date(from);
  const t = new Date(to);

  f.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return today >= f && today <= t;
};

const isPastInRange = (from, to) => {
  const today = new Date();

  const f = new Date(from);
  const t = new Date(to);

  f.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return f < today;
};

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
        {row.original.revenueContribution.toFixed(3)}%
      </span>
    ),
  },
];

// export const Overview = () => {
//   const { from, to } = useSelector(
//     (state) => state.dashboardFilters.dateRange
//   );

//   const { data: outlets } = useGetAllOutletsQuery();

//   const [snapshotApi] = useGetSnapshotDeploymentDataMutation();
//   const [liveApi] = useGetLiveDeploymentDataMutation();

//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const load = async () => {
//     try {
//       setLoading(true);

//       const outletIds = outlets.data.map((o) => o._id);
//       const batches = chunkArray(outletIds, 250);

//       let finalResult = [];

//       const includeLive = isTodayInRange(from, to);
//       const includePast = isPastInRange(from, to);

//       for (const batch of batches) {
//         let snapshotData = [];
//         let liveData = [];

//         if (includePast) {
//           const snapshot = await snapshotApi({
//             outletIds: batch,
//             from,
//             to,
//           }).unwrap();
//           snapshotData = snapshot.data;
//         }

//         if (includeLive) {
//           const live = await liveApi({
//             outletIds: batch,
//           }).unwrap();
//           liveData = live.data;
//         }

//         let merged = [];
//         if (includePast && includeLive) {
//           merged = mergeAnalytics(snapshotData, liveData);
//         } else if (includePast) {
//           merged = mergeAnalytics(snapshotData);
//         } else if (includeLive) {
//           merged = mergeAnalytics([], liveData);
//         }

//         finalResult = finalResult.concat(merged);
//       }

//       // console.log("ghjk",finalResult);

//       setData(finalResult);
//     } catch (err) {
//       console.error("Analytics loading failed", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!outlets?.data || !from || !to) return;

//     load();
//   }, [outlets, from, to]);
//   const aggregated = aggregateData(data);

//   const [focusedDeployment, setFocusedDeployment] = useState(null);

//   const displayedData = focusedDeployment
//     ? {
//       ...focusedDeployment,
//       totalOrder: focusedDeployment.confirmedOrders,
//       totalBillCanceled: focusedDeployment.canceledOrders,
//     }
//     : aggregated;


//   const handleRowClick = (row) => {
//     setFocusedDeployment((prev) =>
//       prev?.outletId === row.outletId ? null : row
//     );
//   };

//   const headerText = focusedDeployment
//     ? `Showing data for outlet: ${focusedDeployment.outletName}`
//     : "Showing aggregated data across all outlets";

//   return (
//     <div className="w-full bg-gray-50 min-h-screen pb-4">
//       <AnalyticsHeader
//         headerTitle="Sales Analytics"
//         description="Live performance insights across all outlets"
//         onRefresh={load}
//         isRefreshing={loading}
//         isOutlet={false}
//       />

//       {displayedData ? <div className="@container/main flex flex-col gap-2 pt-4 pb-4">
//         <p className="text-md text-gray-500 px-6">{headerText}</p>
//         {loading || !data ? (
//           <div className="px-4 lg:px-6"><GridLoader /></div>
//         ) : (
//           <>
//             <AnalyticsCards data={displayedData} />
//             <SecondaryMetrics data={displayedData} />
//           </>
//         )}
//       </div> 
//       <section>
//         <h2 className="mb-4 text-sm text-gray-400 px-4 lg:px-6">
//           Outlets Insights: click on a table row to see the outlet data
//         </h2>

//         <div className="flex flex-col gap-4 px-4 lg:px-6 lg:flex-row">
//           {loading ? (
//             <>
//               <div className="flex-1"><SkeletonLoader /></div>
//               <div className="flex-1"><SkeletonLoader /></div>
//             </>
//           ) : (
//             <>
//               <TabSalesBarChart
//                 title="Top Outlets"
//                 description="Top performing deployments as per sales"
//                 data={data ?? []}
//                 xKey="outletName"
//                 yKey="totalSale"
//                 onBarClick={() => { }}
//               />

//               <DataCard
//                 description="Per outlet sales and contribution"
//                 title={"Outlet Data"}
//                 data={data ?? []}
//                 columns={outletColumns}
//                 onRowClick={handleRowClick}
//               />
//             </>
//           )}
//         </div>
//       </section>:
//       <div className="flex flex-col items-center gap-4 py-20">
//         <Lottie
//           animationData={noDataAnimation}
//           loop={true}
//           className="w-40 h-40"
//         />
//         </div>
//       }

//     </div>
//   );
// };

export const Overview = () => {
  const { from, to } = useSelector(
    (state) => state.dashboardFilters.dateRange
  );

  const rangeOver30 = isOver30Days(from, to);

  const { data: outlets } = useGetAllOutletsQuery();

  const [snapshotApi] = useGetSnapshotDeploymentDataMutation();
  const [liveApi] = useGetLiveDeploymentDataMutation();
  const [requestReportExport, { isLoading: exportLoading }] =
    useRequestReportExportMutation();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focusedDeployment, setFocusedDeployment] = useState(null);

  const handleSalesExport = async (email) => {
    try {
      await requestReportExport({ from, to, email, type: "sales" }).unwrap();
      toast.success("Report generation started! You'll receive an email when it's ready.");
    } catch {
      toast.error("Failed to trigger export. Please try again.");
    }
  };

  const load = async () => {
    try {
      if (!outlets?.data?.length) return;

      setLoading(true);

      const outletIds = outlets.data.map((o) => o._id);
      const batches = chunkArray(outletIds, 250);

      let finalResult = [];

      const includeLive = isTodayInRange(from, to);
      const includePast = isPastInRange(from, to);

      for (const batch of batches) {
        let snapshotData = [];
        let liveData = [];

        if (includePast) {
          const snapshot = await snapshotApi({
            outletIds: batch,
            from,
            to,
          }).unwrap();

          snapshotData = snapshot?.data ?? [];
        }

        if (includeLive) {
          const live = await liveApi({
            outletIds: batch,
          }).unwrap();

          liveData = live?.data ?? [];
        }

        let merged = [];

        if (includePast && includeLive) {
          merged = mergeAnalytics(snapshotData, liveData);
        } else if (includePast) {
          merged = mergeAnalytics(snapshotData);
        } else if (includeLive) {
          merged = mergeAnalytics([], liveData);
        }

        finalResult = finalResult.concat(merged);
      }

      setData(finalResult);
    } catch (err) {
      console.error("Analytics loading failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!outlets?.data || !from || !to || rangeOver30) return;
    load();
  }, [outlets, from, to, rangeOver30]);

  const aggregated = aggregateData(data);

  const displayedData = focusedDeployment
    ? {
        ...focusedDeployment,
        totalOrder: focusedDeployment.confirmedOrders,
        totalBillCanceled: focusedDeployment.canceledOrders,
      }
    : aggregated;

  const handleRowClick = (row) => {
    setFocusedDeployment((prev) =>
      prev?.outletId === row.outletId ? null : row
    );
  };

  const headerText = focusedDeployment
    ? `Showing data for outlet: ${focusedDeployment.outletName}`
    : "Showing aggregated data across all outlets";

  const hasData = data.length > 0;

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        onRefresh={rangeOver30 ? undefined : load}
        isRefreshing={loading}
        isOutlet={false}
      />

      {rangeOver30 ? (
        <div className="px-6 pt-2">
          <ExportBanner
            label="Sales"
            onExport={handleSalesExport}
            isLoading={exportLoading}
          />
        </div>
      ) : loading ? (
        <div className="px-4 lg:px-6 pt-6">
          <GridLoader />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <Lottie
            animationData={noDataAnimation}
            loop={true}
            className="w-100 h-100"
          />
          <p className="text-gray-400 text-sm">No analytics data available</p>
        </div>
      ) : (
        <>
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
                data={data}
                xKey="outletName"
                yKey="totalSale"
                onBarClick={() => {}}
              />

              <DataCard
                description="Per outlet sales and contribution"
                title="Outlet Data"
                data={data}
                columns={outletColumns}
                onRowClick={handleRowClick}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
};