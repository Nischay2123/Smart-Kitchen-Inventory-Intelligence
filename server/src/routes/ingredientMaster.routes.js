import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createIngredient, deleteIngredient, getAllIngredients } from "../controllers/ingredientMaster.controller.js";


const router = express.Router();

router.post("/create_ingredient",verifyJwt, createIngredient);
router.get("/get_all_ingredient",verifyJwt, getAllIngredients);
router.delete("/delete/:ingredientId",verifyJwt, deleteIngredient);

export default router;