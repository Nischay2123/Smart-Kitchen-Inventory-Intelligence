import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createOutlet, deleteOutlet, getAllOutlets } from "../controllers/outlet.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createOutlet);
router.get("/", verifyJwt, getAllOutlets);
router.delete("/:outletId", verifyJwt, deleteOutlet);

export default router;