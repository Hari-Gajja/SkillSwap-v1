import ConnectionRequest from "../models/connectionRequest.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const sendConnectionRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;

    // Don't allow sending request to self
    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({ message: "Cannot send connection request to yourself" });
    }

    // Check if users are already connected or have a pending request
    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUser: fromUserId, toUser: toUserId },
        { fromUser: toUserId, toUser: fromUserId }
      ],
      status: { $in: ["pending", "accepted"] }
    });

    if (existingRequest) {
      const status = existingRequest.status;
      if (status === "pending") {
        return res.status(400).json({ message: "Connection request already exists" });
      } else if (status === "accepted") {
        return res.status(400).json({ message: "Users are already connected" });
      }
    }

    const connectionRequest = new ConnectionRequest({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    await connectionRequest.save();

    // Populate the fromUser details
    const populatedRequest = await connectionRequest.populate([
      { path: "fromUser", select: "name email profilePic" },
      { path: "toUser", select: "name email profilePic" }
    ]);

    // Emit socket event to the receiver
    const receiverSocketId = getReceiverSocketId(toUserId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("connectionRequest", populatedRequest);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.log("Error in sendConnectionRequest: ", error.message);
    res.status(500).json({ 
      message: error.message || "Server error",
      error: error.stack 
    });
  }
};

export const respondToConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { accept } = req.body;
    const userId = req.user._id;

    const connectionRequest = await ConnectionRequest.findById(requestId)
      .populate("fromUser", "-password")
      .populate("toUser", "-password");

    if (!connectionRequest) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    if (connectionRequest.toUser._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    connectionRequest.status = accept ? "accepted" : "declined";
    await connectionRequest.save();

    // Emit socket event to the sender
    const senderSocketId = getReceiverSocketId(connectionRequest.fromUser._id);
    if (senderSocketId) {
      io.to(senderSocketId).emit("connectionRequestResponse", connectionRequest);
    }

    res.status(200).json(connectionRequest);
  } catch (error) {
    console.log("Error in respondToConnectionRequest: ", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const pendingRequests = await ConnectionRequest.find({
      toUser: userId,
      status: "pending",
    })
      .populate("fromUser", "-password")
      .populate("toUser", "-password");

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.log("Error in getPendingRequests: ", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
