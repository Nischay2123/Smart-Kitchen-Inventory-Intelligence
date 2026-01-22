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

    return () => {
      socket.off("stock_updated", onUpdate);
      socket.off("stock_alert");
    };
  }, [tenantId, outletId]);
};


export const useStockMovementSocket = ({
  tenantId,
  outletId,
  onCreate,
  onError,
}) => {
  useEffect(() => {
    console.log(tenantId, outletId);
    if (!tenantId || !outletId) return;
    
    socket.emit("join_outlet", { tenantId, outletId });

    socket.on("STOCK_MOVEMENT_CREATED", onCreate);
    socket.on("connect_error", onError);
    socket.on("disconnect", onError);

    return () => {
      socket.off("STOCK_MOVEMENT_CREATED", onCreate);
      socket.off("connect_error", onError);
      socket.off("disconnect", onError);
    };
  }, [tenantId, outletId, onCreate, onError]);
};
export const useSalesSocket = ({
  tenantId,
  outletId,
  onCreate,
  onError,
}) => {
  useEffect(() => {
    
    console.log(tenantId, outletId);
    if (!tenantId || !outletId) return;
    
    socket.emit("join_outlet", { tenantId, outletId });

    socket.on("SALES_CREATED", onCreate);
    socket.on("connect_error", onError);
    socket.on("disconnect", onError);

    return () => {
      socket.off("SALES_CREATED", onCreate);
      socket.off("connect_error", onError);
      socket.off("disconnect", onError);
    };
  }, [tenantId, outletId, onCreate, onError]);
};
