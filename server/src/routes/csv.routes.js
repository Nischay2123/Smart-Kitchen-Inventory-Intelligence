import express from "express";
import { exportCsv, getTemplate } from "../controllers/csv.controller.js";

import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { csvRateLimit } from "../middlerwares/rateLimiter.middleware.js";

const router = express.Router();

router.get("/export/:type", csvRateLimit, verifyJwt, exportCsv);
router.get("/template/:type", verifyJwt, getTemplate);

export default router;
