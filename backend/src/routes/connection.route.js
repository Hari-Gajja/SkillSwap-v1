import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendConnectionRequest,
  respondToConnectionRequest,
  getPendingRequests,
} from "../controllers/connection.controller.js";

const router = express.Router();

router.post("/send", protectRoute, sendConnectionRequest);
router.post("/:requestId/respond", protectRoute, respondToConnectionRequest);
router.get("/pending", protectRoute, getPendingRequests);

export default router;
