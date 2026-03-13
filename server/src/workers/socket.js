import { io } from "socket.io-client";
import config from "../utils/config.js";

const socketServerUrl = process.env.SOCKET_SERVER_URL || "http://localhost:8000";

export const socket = io(socketServerUrl, {
  auth: {
    workerSecret: config.WORKER_SOCKET_SHARED_SECRET,
  },
});

export const emitEvent = (room, event, payload) => {
  
  socket.emit("worker_emit", { room, event, payload });

};
