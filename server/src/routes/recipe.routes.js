import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createOrUpdateRecipe, getSingleRecipe, bulkCreateRecipes } from "../controllers/recipe.controller.js";


const router = express.Router();


router.post("/", verifyJwt, createOrUpdateRecipe);
router.post("/bulk", verifyJwt, bulkCreateRecipes);
router.get("/:itemId", verifyJwt, getSingleRecipe);

export default router;