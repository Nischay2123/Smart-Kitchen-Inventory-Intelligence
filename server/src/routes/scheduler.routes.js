import express from "express";
import { getSchedulerLogs } from "../controllers/scheduler.controller.js";

const router = express.Router();

router.get("/", getSchedulerLogs);

export default router;
