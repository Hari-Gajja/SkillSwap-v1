import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  createSession,
  getSessionsByUser,
  updateSessionStatus,
  findPeers
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createSession);
router.get("/list", protectRoute, getSessionsByUser);
router.put("/:sessionId/status", protectRoute, updateSessionStatus);
router.get("/peers", protectRoute, findPeers);

export default router;
