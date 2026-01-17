import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createOutlet, deleteOutlet, getAllOutlets } from "../controllers/outlet.controller.js";


const router = express.Router();

router.post("/create_outlet",verifyJwt, createOutlet);
router.get("/get_all_outlet",verifyJwt, getAllOutlets);
router.delete("/delete/:outletId",verifyJwt, deleteOutlet);

export default router;