import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createOrUpdateRecipe , getSingleRecipe } from "../controllers/recipe.controller.js";


const router = express.Router();

router.post("/recipe",verifyJwt, createOrUpdateRecipe);
router.get("/get_recipe/:itemId",verifyJwt, getSingleRecipe);

export default router;