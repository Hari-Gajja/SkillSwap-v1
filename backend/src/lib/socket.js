import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Configure allowed origins for Socket.IO
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://skillswap-v1-1.onrender.com",
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle connection requests
  socket.on("sendConnectionRequest", (data) => {
    const receiverSocketId = userSocketMap[data.toUser._id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newConnectionRequest", {
        _id: data._id,
        fromUser: data.fromUser,
        toUser: data.toUser,
        timestamp: data.timestamp,
        status: 'pending'
      });
    }
  });

  // Handle connection request responses
  socket.on("connectionRequestResponse", (data) => {
    const requesterSocketId = userSocketMap[data.fromUser._id];
    if (requesterSocketId) {
      io.to(requesterSocketId).emit("connectionRequestUpdated", {
        ...data,
        status: data.accepted ? 'accepted' : 'declined'
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
