import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createIngredient, deleteIngredient, getAllIngredients, getAllIngredientsInOnce } from "../controllers/ingredientMaster.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createIngredient);
router.get("/", verifyJwt, getAllIngredients);
router.get("/all", verifyJwt, getAllIngredientsInOnce);
router.delete("/:ingredientId", verifyJwt, deleteIngredient);

export default router;