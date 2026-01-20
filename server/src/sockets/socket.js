import { Server } from "socket.io";

let io;

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Join outlet room
    socket.on("join_outlet", ({ tenantId, outletId }) => {
      if (!tenantId || !outletId) return;

      const room = `tenant:${tenantId}:outlet:${outletId}`;
      socket.join(room);

      console.log(`📦 Joined room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });

    socket.on("worker_emit", ({ room, event, payload }) => {
      console.log("socket server",room);
      
      io.to(room).emit(event, payload);
    });

  });


  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
