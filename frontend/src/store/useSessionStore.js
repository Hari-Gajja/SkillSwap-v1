import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useSessionStore = create((set, get) => ({
  sessions: [],
  isLoading: false,
  selectedSession: null,

  fetchSessions: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/api/sessions/list");
      set({ sessions: response.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching sessions");
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (data) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post("/api/sessions/create", data);
      set(state => ({
        sessions: [...state.sessions, response.data]
      }));
      toast.success("Session scheduled successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating session");
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSessionStatus: async (sessionId, data) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.put(`/api/sessions/${sessionId}/status`, data);
      set(state => ({
        sessions: state.sessions.map(session =>
          session._id === sessionId ? response.data : session
        )
      }));
      toast.success("Session status updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating session");
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedSession: (session) => set({ selectedSession: session })
}));
