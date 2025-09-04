import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generateQuiz, getQuizById, submitQuizAttempt } from "../controllers/quiz.controller.js";

const router = express.Router();

router.post("/generate", protectRoute, generateQuiz);
router.get("/:id", protectRoute, getQuizById);
router.post("/:id/submit", protectRoute, submitQuizAttempt);

export default router;
