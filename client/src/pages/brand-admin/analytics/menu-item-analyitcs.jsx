import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AnalyticsHeader from "@/components/AnalyticsHeader";
import {
  useGetMenuMatrixDataQuery,
  useGetMenuItemDataQuery,
  useRequestMenuItemExportMutation,
  useRequestMenuMatrixExportMutation,
} from "@/redux/apis/brand-admin/analyticsApi";
import MenuEngineeringMatrix from "@/components/menu-matrix";
import DataCard from "@/components/data-card/data-card";
import { SkeletonLoader } from "@/components/laoder";

// ─── Column definitions ───────────────────────────────────────────────
const outletColumns = [
  { accessorKey: "itemName", header: "Item" },
  { accessorKey: "totalQty", header: "Qty Sold" },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ getValue }) => `₹${getValue()}`,
  },
  {
    accessorKey: "totalMakingCost",
    header: "Making Cost",
    cell: ({ getValue }) => `₹${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ getValue }) => `₹${getValue().toFixed(2)}`,
  },
  {
    accessorKey: "profitMargin",
    header: "Profit Margin (%)",
    cell: ({ getValue }) => `${getValue().toFixed(2)}%`,
  },
];

// ─── Helper ───────────────────────────────────────────────────────────
const isOver30Days = (from, to) => {
  if (!from || !to) return false;
  return (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24) > 30;
};

// ─── Export Banner ────────────────────────────────────────────────────
const ExportBanner = ({ label, onExport, isLoading }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
      border: "1px solid #c7d2fe",
      borderRadius: "12px",
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      alignItems: "flex-start",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "22px" }}>📅</span>
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#3730a3" }}>
        Date Range Exceeds 1 Month
      </h3>
    </div>
    <p style={{ margin: 0, color: "#4b5563", fontSize: "14px", lineHeight: "1.6" }}>
      Displaying <strong>{label}</strong> data for more than 30 days directly would be too large
      to render. Instead, click below to generate a CSV report — it will be emailed to you once ready.
    </p>
    <button
      onClick={onExport}
      disabled={isLoading}
      style={{
        marginTop: "4px",
        background: isLoading ? "#a5b4fc" : "#4f46e5",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 22px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: isLoading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "background 0.2s",
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid #fff",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Requesting…
        </>
      ) : (
        <>📧 Request CSV Export</>
      )}
    </button>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────
export const MenuItemAnalysis = () => {
  const { from, to } = useSelector((state) => state.dashboardFilters.dateRange);
  const outletId = useSelector((state) => state.dashboardFilters.outletId);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [reportEmail, setReportEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reportType, setReportType] = useState(null); // 'matrix' or 'profit'

  const rangeOver30 = isOver30Days(from, to);

  // Queries — only run when range ≤ 30 days
  const { data, isLoading, refetch } = useGetMenuMatrixDataQuery(
    { from, to },
    { skip: !from || !to || rangeOver30 }
  );
  const { data: outletData, isLoading: outletDataLoading, refetch: outletDataRefetch } =
    useGetMenuItemDataQuery(
      { from, to, outletId },
      { skip: !from || !to || !outletId || rangeOver30 }
    );

  // Export mutations — triggered when range > 30 days
  const [requestMenuMatrixExport, { isLoading: matrixExportLoading }] =
    useRequestMenuMatrixExportMutation();
  const [requestMenuItemExport, { isLoading: profitExportLoading }] =
    useRequestMenuItemExportMutation();

  const handleMatrixExport = () => {
    setReportType("matrix");
    setReportEmail("");
    setConfirmEmail("");
    setEmailModalOpen(true);
  };

  const handleProfitExport = () => {
    setReportType("profit");
    setReportEmail("");
    setConfirmEmail("");
    setEmailModalOpen(true);
  };

  const submitExport = async () => {
    if (!reportEmail || !confirmEmail) {
      toast.error("Please enter and confirm your email.");
      return;
    }
    if (reportEmail !== confirmEmail) {
      toast.error("Emails do not match.");
      return;
    }

    try {
      if (reportType === "matrix") {
        await requestMenuMatrixExport({ from, to, email: reportEmail }).unwrap();
      } else if (reportType === "profit") {
        await requestMenuItemExport({ from, to, outletId, email: reportEmail }).unwrap();
      }
      toast.success("Report generation started! You'll receive an email when it's ready.");
      setEmailModalOpen(false);
    } catch {
      toast.error("Failed to trigger export. Please try again.");
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen pb-4">
      <AnalyticsHeader
        headerTitle="Sales Analytics"
        description="Live performance insights across all outlets"
        isRefreshing={isLoading || outletDataLoading}
        onRefresh={() => {
          if (!rangeOver30) {
            refetch();
            outletDataRefetch();
          }
        }}
      />

      {/* Menu Engineering Matrix section */}
      <div className="px-6 pt-2">
        {rangeOver30 ? (
          <ExportBanner
            label="Menu Engineering Matrix"
            onExport={handleMatrixExport}
            isLoading={matrixExportLoading}
          />
        ) : isLoading || !data ? (
          <SkeletonLoader />
        ) : (
          <MenuEngineeringMatrix data={data?.data ?? []} />
        )}
      </div>

      {/* Outlet profit table section */}
      <div className="flex flex-col gap-4 px-4 lg:px-6 lg:flex-row pt-4">
        {rangeOver30 ? (
          <ExportBanner
            label="Menu Item Profit"
            onExport={handleProfitExport}
            isLoading={profitExportLoading}
          />
        ) : outletDataLoading ? (
          <SkeletonLoader />
        ) : (
          <DataCard
            description="Per outlet sales and contribution"
            title={"Outlet Data"}
            data={outletData?.data ?? []}
            columns={outletColumns}
          />
        )}
      </div>

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Receive Report via Email</DialogTitle>
            <DialogDescription>
              Please enter the email address where you would like to receive the requested CSV report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmEmail">Confirm Email</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="Confirm your email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEmailModalOpen(false)}
              disabled={matrixExportLoading || profitExportLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitExport}
              disabled={matrixExportLoading || profitExportLoading}
            >
              {(matrixExportLoading || profitExportLoading) ? "Requesting..." : "Send Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
