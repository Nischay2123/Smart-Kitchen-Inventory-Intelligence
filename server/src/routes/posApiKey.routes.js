import express from "express";
import { verifyJwt } from "../middlerwares/auth.middleware.js";
import {
  generateAPIKey,
  revokeAPIKey,
  listAPIKeys,
} from "../controllers/posApiKey.controller.js";

const router = express.Router();

// All routes require JWT authentication (BRAND_ADMIN only, checked in controller)
router.post("/generate", verifyJwt, generateAPIKey);
router.post("/:keyId/revoke", verifyJwt, revokeAPIKey);
router.get("/", verifyJwt, listAPIKeys);

export default router;
