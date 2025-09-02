import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Add a static method to find connected users
connectionRequestSchema.statics.findConnectedUsers = async function(userId) {
  const connections = await this.find({
    $or: [
      { fromUser: userId, status: "accepted" },
      { toUser: userId, status: "accepted" }
    ]
  }).populate([
    { path: "fromUser", select: "name email profilePic" },
    { path: "toUser", select: "name email profilePic" }
  ]);

  // Extract unique connected users
  const connectedUsers = connections.map(conn => {
    if (conn.fromUser._id.toString() === userId.toString()) {
      return conn.toUser;
    }
    return conn.fromUser;
  });

  return connectedUsers;
};

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);

export default ConnectionRequest;
