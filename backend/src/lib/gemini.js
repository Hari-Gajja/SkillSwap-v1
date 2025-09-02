import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuestionsWithGemini = async (skill, type) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate 10 ${type === 'quiz' ? 'multiple choice questions' : 'coding problems'} about ${skill}. 
    6 should be medium difficulty and 4 should be hard difficulty.
    ${type === 'quiz' ? 'Include 4 options for each question.' : 'Include sample input/output and test cases.'}
    Format the response as a JSON array with each question having properties:
    - text (the question)
    - ${type === 'quiz' ? 'options (array of 4 choices)' : 'sampleInput and sampleOutput'}
    - correctAnswer
    - difficulty (medium or hard)
    Make the questions challenging and practical.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const questions = JSON.parse(text);

    // Validate and format questions
    return questions.map(q => ({
      text: q.text,
      options: type === 'quiz' ? q.options : [],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      type
    }));
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw error;
  }
};
