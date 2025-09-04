import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const sessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    skill: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'booked', 'ongoing', 'completed', 'cancelled'],
      default: 'available'
    },
    timeSlot: {
      type: timeSlotSchema,
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60
    },
    videoCallRoom: {
      type: String, // Unique room ID for video call
      unique: true,
      sparse: true
    },
    joinedAt: {
      teacher: Date,
      student: Date
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      givenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    price: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Create unique room ID before saving
sessionSchema.pre('save', function(next) {
  if (!this.videoCallRoom && this.status === 'booked') {
    this.videoCallRoom = `room_${this._id}_${Date.now()}`;
  }
  next();
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
