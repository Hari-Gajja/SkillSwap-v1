import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    skill: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String
    }
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
