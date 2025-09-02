import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { BrainCircuit, Check, Loader2, XCircle } from "lucide-react";

const QuizPage = () => {
  const { authUser } = useAuthStore();
  const [selectedSkill, setSelectedSkill] = useState("");
  const [quizType, setQuizType] = useState("quiz");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/quiz/generate", {
        skill: selectedSkill,
        type: quizType,
      });
      setQuiz(response.data);
      setAnswers(new Array(response.data.questions.length).fill(""));
      setResults(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error generating quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/api/quiz/submit", {
        quizId: quiz._id,
        answers,
      });
      setResults(response.data);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="size-6" />
              Quiz & Problems
            </h1>
            <p className="text-base-content/70">
              Test your knowledge with AI-generated questions
            </p>
          </div>

          {/* Quiz Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Skill Selection */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Select Skill</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="">Select a skill</option>
                {authUser?.skills?.map((skill) => (
                  <option key={skill.skillName} value={skill.skillName}>
                    {skill.skillName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quiz Type Selection */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Type</span>
              </label>
              <select
                className="select select-bordered"
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
              >
                <option value="quiz">Multiple Choice Quiz</option>
                <option value="problem">Coding Problems</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary w-full md:w-auto"
            onClick={generateQuiz}
            disabled={!selectedSkill || loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Questions"
            )}
          </button>

          {/* Quiz Questions */}
          {quiz && (
            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={index} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary">{question.difficulty}</span>
                      <h3 className="font-medium">Question {index + 1}</h3>
                    </div>
                    <p className="mt-2">{question.text}</p>

                    {quizType === "quiz" ? (
                      <div className="mt-4 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={answers[index] === option}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[index] = e.target.value;
                                setAnswers(newAnswers);
                              }}
                              className="radio radio-primary"
                              disabled={results}
                            />
                            <span>{option}</span>
                            {results && (
                              option === question.correctAnswer ? (
                                <Check className="size-5 text-success" />
                              ) : answers[index] === option ? (
                                <XCircle className="size-5 text-error" />
                              ) : null
                            )}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <div className="bg-base-300 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Sample Input:</h4>
                          <pre className="whitespace-pre-wrap">{question.sampleInput}</pre>
                        </div>
                        <div className="bg-base-300 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Sample Output:</h4>
                          <pre className="whitespace-pre-wrap">{question.sampleOutput}</pre>
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Your Solution:</span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered h-32 font-mono"
                            value={answers[index]}
                            onChange={(e) => {
                              const newAnswers = [...answers];
                              newAnswers[index] = e.target.value;
                              setAnswers(newAnswers);
                            }}
                            placeholder="Write your code here..."
                            disabled={results}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!results && (
                <button
                  className="btn btn-primary w-full md:w-auto"
                  onClick={handleSubmit}
                  disabled={loading || answers.some(a => !a)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answers"
                  )}
                </button>
              )}

              {/* Results */}
              {results && (
                <div className="card bg-base-300">
                  <div className="card-body">
                    <h3 className="card-title">Results</h3>
                    <div className="stats stats-vertical lg:stats-horizontal shadow">
                      <div className="stat">
                        <div className="stat-title">Score</div>
                        <div className="stat-value">{results.score}/{results.total}</div>
                      </div>
                      <div className="stat">
                        <div className="stat-title">Percentage</div>
                        <div className="stat-value">{results.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary mt-4"
                      onClick={() => {
                        setQuiz(null);
                        setAnswers([]);
                        setResults(null);
                      }}
                    >
                      Try Another Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
