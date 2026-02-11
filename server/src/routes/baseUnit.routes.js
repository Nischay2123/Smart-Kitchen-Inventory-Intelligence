import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createUnit, getAllBaseUnits } from "../controllers/baseUnit.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createUnit);
router.get("/", verifyJwt, getAllBaseUnits);

export default router;