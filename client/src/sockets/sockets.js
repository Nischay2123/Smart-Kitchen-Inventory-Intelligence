import { useEffect } from "react";
import { io } from "socket.io-client";

export const socket = io("http://localhost:8000", {
  withCredentials: true,
});


export const useStockSocket = ({ tenantId, outletId, onUpdate }) => {
  useEffect(() => {
    if (!tenantId || !outletId) return;

    socket.emit("join_outlet", { tenantId, outletId });

    socket.on("stock_updated", onUpdate);

    socket.on("stock_alert", (data) => {
      console.warn("⚠️ Stock alert:", data);
    });

    return () => {
      socket.off("stock_updated", onUpdate);
      socket.off("stock_alert");
    };
  }, [tenantId, outletId]);
};
