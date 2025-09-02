import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    skills: [{
      skillName: {
        type: String,
        required: true
      },
      proficiencyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
      }
    }],
    skillsToLearn: [{
      skillName: {
        type: String,
        required: true
      }
    }],
    certificates: [{
      title: String,
      fileUrl: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
    sessionsCompleted: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
