import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useQuizStore = create((set) => ({
  quiz: null,
  isLoading: false,
  results: null,

  generateQuiz: async (data) => {
    set({ isLoading: true, quiz: null, results: null });
    try {
      const response = await axiosInstance.post("/api/quiz/generate", data);
      set({ quiz: response.data });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error generating quiz");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  submitQuiz: async (quizId, answers) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/api/quiz/submit", {
        quizId,
        answers
      });
      set({ results: response.data });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting quiz");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetQuiz: () => set({ quiz: null, results: null })
}));
