import { io } from "socket.io-client";

export const socket = io("http://localhost:8000", {
  auth: { service: "worker" }
});

export const emitEvent = (room, event, payload) => {
  // console.log(event, payload);
  
  socket.emit("worker_emit", { room, event, payload });

};
