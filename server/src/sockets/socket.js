import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import config from "../utils/config.js";

const parser = cookieParser();

let io;

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use((socket, next) => {
    const workerSharedSecret = config .WORKER_SOCKET_SHARED_SECRET;
    const workerSecretFromHandshake = socket.handshake.auth?.workerSecret;
    
    if (
      workerSharedSecret &&
      workerSecretFromHandshake &&
      workerSecretFromHandshake === workerSharedSecret
    ) {
      socket.isWorker = true;
      return next();
    }

    try {
      parser(socket.request, {}, () => { });

      const { accessToken } = socket.request.cookies || {};

      if (!accessToken) {
        return next(new Error("Unauthorized"));
      }

      const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

      socket.isWorker = false;
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
      if (socket.isWorker || !socket.user) return;
      if (!tenantId || !outletId) return;

      if (socket.user.tenantId !== tenantId || socket.user.outletId !== outletId) {
        console.warn(`User ${socket.user._id} attempted unauthorized join to ${tenantId}`);
        return;
      }

      const room = `tenant:${tenantId}:outlet:${outletId}`;
      socket.join(room);

      console.log(`Joined room ${room}`);
    });

    socket.on("join_tenant", ({ tenantId }) => {
      if (socket.isWorker || !socket.user) return;
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
      if (!socket.isWorker) {
        console.warn(`Unauthorized worker_emit attempt by socket ${socket.id}`);
        return;
      }
      
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
