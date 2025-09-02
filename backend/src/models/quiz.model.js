import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['medium', 'hard'],
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'problem'],
    required: true
  },
  skill: {
    type: String,
    required: true
  }
});

const quizSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['quiz', 'problem'],
      required: true
    }
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
