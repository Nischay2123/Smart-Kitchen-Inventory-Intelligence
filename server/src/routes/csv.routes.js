import express from "express";
import {  exportCsv, getTemplate } from "../controllers/csv.controller.js";

import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = express.Router();

router.use(verifyJwt);

router.get("/export/:type", exportCsv);
router.get("/template/:type", getTemplate);

export default router;
