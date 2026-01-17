import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createUnit, getAllBaseUnits } from "../controllers/baseUnit.controller.js";


const router = express.Router();

router.post("/create_unit",verifyJwt, createUnit);
router.get("/get_all_unit",verifyJwt, getAllBaseUnits);

export default router;