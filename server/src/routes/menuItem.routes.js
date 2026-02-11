import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createMenuItem, deleteMenuItem, getAllMenuItems } from "../controllers/menuItem.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createMenuItem);
router.get("/", verifyJwt, getAllMenuItems);
router.delete("/:menuItemId", verifyJwt, deleteMenuItem);

export default router;