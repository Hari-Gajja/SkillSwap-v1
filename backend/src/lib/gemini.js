import axios from 'axios';

export const generateQuestionsWithGemini = async (skill, type) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    // Use the base URL without the model and method
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    const prompt = `Act as a quiz generator. Create a quiz about ${skill} with the following specifications:

1. Generate exactly 10 ${type === 'quiz' ? 'multiple choice questions' : 'coding problems'}
2. Include 6 medium difficulty and 4 hard difficulty questions
3. ${type === 'quiz' 
      ? 'For each question, provide exactly 4 multiple choice options' 
      : 'For each problem, provide clear sample input and expected output'}
4. Format your response as a valid JSON array like this example:
[
  {
    "text": "What is ${skill}?",
    ${type === 'quiz' 
      ? '"options": ["First option", "Second option", "Third option", "Fourth option"],' 
      : '"sampleInput": "Example input", "sampleOutput": "Example output",'}
    "correctAnswer": ${type === 'quiz' ? '"Second option"' : '"Solution here"'},
    "difficulty": "medium"
  }
]

Important: Provide only the JSON array in your response. Make sure it's valid JSON that can be parsed.`;

    const response = await axios.post(`${baseUrl}?key=${apiKey}`, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.candidates[0].content.parts[0].text;
    console.log('AI Response:', text); // Add logging to debug the response

    // Parse the JSON response
    let questions;
    try {
      questions = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid response format from AI: not an array or empty array");
    }

    // Validate and format each question
    return questions.map(q => {
      if (!q.text || !q.correctAnswer || !q.difficulty) {
        throw new Error("Invalid question format: missing required fields");
      }
      
      return {
        text: q.text,
        options: type === 'quiz' ? (q.options || []) : [],
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty.toLowerCase(),
        type,
        ...(type !== 'quiz' && {
          sampleInput: q.sampleInput,
          sampleOutput: q.sampleOutput
        })
      };
    });
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw error;
  }
};
