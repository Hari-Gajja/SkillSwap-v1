import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      pendingRequests: [],

      addNotification: (notification) => {
        const { notifications } = get();
        set({
          notifications: [notification, ...notifications],
          unreadCount: get().unreadCount + 1,
        });
      },

      addConnectionRequest: (request) => {
        const { pendingRequests } = get();
        set({
          pendingRequests: [request, ...pendingRequests],
          unreadCount: get().unreadCount + 1,
        });
        // Also add a notification for the request
        const notification = {
          _id: Date.now().toString(),
          type: 'connection_request',
          user: request.fromUser,
          message: "sent you a connection request",
          timestamp: new Date(),
          read: false,
          requestId: request._id
        };
        get().addNotification(notification);
      },

      markAllAsRead: () => {
        set({ unreadCount: 0 });
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find(n => n._id === notificationId);
          if (notification && !notification.read) {
            return { unreadCount: state.unreadCount - 1 };
          }
          return {};
        });
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      handleConnectionRequest: (requestId, accepted) => {
        const { pendingRequests, notifications } = get();
        const request = pendingRequests.find(r => r._id === requestId);
        
        if (!request) return;

        // Emit the response through socket
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("connectionRequestResponse", {
            ...request,
            accepted
          });
        }

        if (accepted) {
          // Add to chat contacts
          const { addToConnectedUsers } = useChatStore.getState();
          addToConnectedUsers(request.fromUser);
          
          // Add acceptance notification
          const notification = {
            _id: Date.now().toString(),
            type: 'connection_accepted',
            user: request.fromUser,
            message: "is now connected with you",
            timestamp: new Date(),
            read: false,
          };
          get().addNotification(notification);
        }

        // Remove the request
        set({
          pendingRequests: pendingRequests.filter(r => r._id !== requestId),
          notifications: notifications.filter(n => n.requestId !== requestId)
        });
      },

      getPendingRequests: () => get().pendingRequests,
    }),
    {
      name: "notification-store",
    }
  )
);
