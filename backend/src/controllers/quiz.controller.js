import Quiz from '../models/quiz.model.js';
import { generateQuestionsWithGemini } from '../lib/gemini.js';

export const generateQuiz = async (req, res) => {
  try {
    const { skill, type } = req.body;
    const userId = req.user._id;

    if (!skill || !type) {
      return res.status(400).json({ message: "Skill and type are required" });
    }

    // Generate questions using Gemini AI
    const questions = await generateQuestionsWithGemini(skill, type);

    const quiz = new Quiz({
      skill,
      type,
      questions,
      createdBy: userId
    });

    await quiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.log("Error in generateQuiz controller:", error);
    const errorMessage = error.response?.data?.error?.message || error.message || "Internal server error";
    res.status(500).json({ message: errorMessage });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.status(200).json(quiz);
  } catch (error) {
    console.log("Error in getQuizById controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) score++;
      return {
        questionId: question._id,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    res.status(200).json({
      score,
      total: quiz.questions.length,
      percentage: (score / quiz.questions.length) * 100,
      results
    });
  } catch (error) {
    console.log("Error in submitQuizAttempt controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
