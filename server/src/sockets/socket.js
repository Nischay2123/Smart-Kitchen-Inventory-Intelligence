import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const parser = cookieParser();

let io;

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use((socket, next) => {

    if (socket.handshake.auth?.service === "worker") {
      return next();
    }
    try {
      parser(socket.request, {}, () => { });

      const { accessToken } = socket.request.cookies || {};

      if (!accessToken) {
        return next(new Error("Unauthorized"));
      }

      const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      socket.user = payload;
      next();
    } catch (err) {
      console.log("Socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });


  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_outlet", ({ tenantId, outletId }) => {
      if (!tenantId || !outletId) return;
      // console.log(socket.user);

      if (socket.user.tenantId !== tenantId || socket.user.outletId !== outletId) {
        console.warn(`User ${socket.user._id} attempted unauthorized join to ${tenantId}`);
        return;
      }

      const room = `tenant:${tenantId}:outlet:${outletId}`;
      socket.join(room);

      console.log(`Joined room ${room}`);
    });

    socket.on("join_tenant", ({ tenantId }) => {
      if (!tenantId) return;

      if (socket.user.tenantId !== tenantId) {
        console.warn(`User ${socket.user._id} attempted unauthorized join to tenant ${tenantId}`);
        return;
      }

      const room = `tenant:${tenantId}`;
      socket.join(room);
      console.log(`Joined tenant room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });

    socket.on("worker_emit", ({ room, event, payload }) => {
      // console.log("socket server",room);

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
