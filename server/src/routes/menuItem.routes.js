import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createMenuItem, deleteMenuItem, getAllMenuItems } from "../controllers/menuItem.controller.js";


const router = express.Router();

router.post("/create_item",verifyJwt, createMenuItem);
router.get("/get_all_item",verifyJwt, getAllMenuItems);
router.delete("/delete/:menuItemId",verifyJwt, deleteMenuItem);

export default router;