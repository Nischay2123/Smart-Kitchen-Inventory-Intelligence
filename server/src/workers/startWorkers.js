import { fork } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WORKER_PATH = path.join(
  __dirname,
  "order.worker.js"
);

const WORKER_COUNT = 4;

console.log(`🚀 Starting ${WORKER_COUNT} workers`);

const startWorker = () => {
  const worker = fork(WORKER_PATH);

  console.log(`Worker PID started: ${worker.pid}`);

  worker.on("exit", () => {
    console.log(
      `Worker ${worker.pid} crashed. Restarting...`
    );
    startWorker();
  });
};

for (let i = 0; i < WORKER_COUNT; i++) {
  startWorker();
}
