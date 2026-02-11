import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import { createOrUpdateRecipe, getSingleRecipe } from "../controllers/recipe.controller.js";


const router = express.Router();

router.post("/", verifyJwt, createOrUpdateRecipe);
router.get("/:itemId", verifyJwt, getSingleRecipe);

export default router;