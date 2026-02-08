import axios from "axios";

const API = "http://localhost:8000/api/v1/genrate_sanpshot";

// start date: 10 Jan
const startDate = new Date("2026-01-10");

// yesterday
const endDate = new Date();
endDate.setDate(endDate.getDate() - 1);

const run = async () => {
  let current = new Date(startDate);

  while (current <= endDate) {
    console.log(
      "Running snapshot for:",
      current.toISOString().slice(0, 10)
    );

    await axios.post(API, {
      date: current
    });

    current.setDate(current.getDate() + 1);
  }

  console.log("All snapshots generated");
};

run();
