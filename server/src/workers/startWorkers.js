import { fork } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WORKER_PATH_ORDER = path.join(__dirname, "order.worker.js");
const WORKER_PATH_SNAPSHOT = path.join(__dirname, "dailySnapshot.worker.js");
const WORKER_PATH_CSV_EXPORT = path.join(__dirname, "csvExport.worker.js");

const WORKER_COUNT = 4;

console.log(`🚀 Starting ${WORKER_COUNT} workers`);

const startWorker = (workerPath, name) => {
  const worker = fork(workerPath);

  console.log(`${name} Worker PID started: ${worker.pid}`);

  worker.on("exit", () => {
    console.log(
      `${name} Worker ${worker.pid} crashed. Restarting...`
    );
    startWorker(workerPath, name);
  });
};

for (let i = 0; i < WORKER_COUNT; i++) {
  startWorker(WORKER_PATH_ORDER, "Order");
}

// Start 1 snapshot worker
startWorker(WORKER_PATH_SNAPSHOT, "Snapshot");

// Start 1 CSV export worker
startWorker(WORKER_PATH_CSV_EXPORT, "CsvExport");
