import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNotificationStore } from "./useNotificationStore";
import { useChatStore } from "./useChatStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Handle connection request responses
    socket.on("connectionRequestResponse", (data) => {
      const { message, status } = data;
      
      // Show a toast notification with the response
      if (status === "accepted") {
        toast.success(message);
      } else {
        toast.error(message);
      }
    });

    // Handle incoming connection requests
    socket.on("newConnectionRequest", (request) => {
      const { addConnectionRequest } = useNotificationStore.getState();
      addConnectionRequest(request);
      toast.success(`New connection request from ${request.fromUser.name}`);
    });

    // Handle connection request updates
    socket.on("connectionRequestUpdated", (data) => {
      const { addNotification } = useNotificationStore.getState();
      const message = data.status === 'accepted' 
        ? `accepted your connection request`
        : `declined your connection request`;
      
      addNotification({
        _id: Date.now().toString(),
        type: `connection_${data.status}`,
        user: data.toUser,
        message,
        timestamp: new Date(),
        read: false
      });

      if (data.status === 'accepted') {
        const { addToConnectedUsers } = useChatStore.getState();
        addToConnectedUsers(data.toUser);
      }

      toast[data.status === 'accepted' ? 'success' : 'error'](
        `${data.toUser.name} ${message}`
      );
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("connectionRequestResponse");
      socket.close();
      set({ socket: null });
    }
  },
}));
