import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  createTimeSlots,
  bookSession,
  getAvailableSessions,
  getUserSessions,
  joinVideoCall,
  endSession,
  getConnectedTeachers
} from "../controllers/session.controller.js";

const router = express.Router();

// Create time slots (for teachers)
router.post("/create-slots", protectRoute, createTimeSlots);

// Book a session (for students)
router.post("/:sessionId/book", protectRoute, bookSession);

// Get available sessions for a skill
router.get("/available", protectRoute, getAvailableSessions);

// Get user's sessions
router.get("/my-sessions", protectRoute, getUserSessions);

// Join video call
router.post("/:sessionId/join", protectRoute, joinVideoCall);

// End session
router.post("/:sessionId/end", protectRoute, endSession);

// Get connected teachers with available sessions
router.get("/teachers", protectRoute, getConnectedTeachers);

export default router;
