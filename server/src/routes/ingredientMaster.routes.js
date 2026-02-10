import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createIngredient, deleteIngredient, getAllIngredients, getAllIngredientsInOnce } from "../controllers/ingredientMaster.controller.js";


const router = express.Router();

router.post("/create_ingredient",verifyJwt, createIngredient);
router.get("/get_all_ingredient",verifyJwt, getAllIngredients);
router.get("/get_all_ingredient_once",verifyJwt, getAllIngredientsInOnce);
router.delete("/delete/:ingredientId",verifyJwt, deleteIngredient);

export default router;