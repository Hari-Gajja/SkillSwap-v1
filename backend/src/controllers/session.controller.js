import Session from '../models/session.model.js';
import User from '../models/user.model.js';
import ConnectionRequest from '../models/connectionRequest.model.js';
import { v4 as uuidv4 } from 'uuid';
import { io, getReceiverSocketId } from '../lib/socket.js';

// Create available time slots for teachers
export const createTimeSlots = async (req, res) => {
  try {
    const { skill, timeSlots, price, invitedUsers = [] } = req.body;
    const teacherId = req.user._id;

    if (!skill || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ message: "Skill and time slots are required" });
    }

    const teacher = await User.findById(teacherId).select('name email profilePic skills');
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify that the teacher has the requested skill
    const hasSkill = teacher.skills.some(s => s.skillName === skill);
    if (!hasSkill) {
      return res.status(400).json({ message: "You don't have the specified skill" });
    }

    const sessions = [];
    
    for (const slot of timeSlots) {
      const session = new Session({
        teacher: teacherId,
        skill,
        timeSlot: {
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false
        },
        price: price || 0,
        status: 'available'
      });
      
      sessions.push(session);
    }

    const savedSessions = await Session.insertMany(sessions);

    // Send notifications to invited users
    if (invitedUsers.length > 0) {
      const invitedUserDetails = await User.find({ 
        _id: { $in: invitedUsers } 
      }).select('name email _id');

      for (const invitedUser of invitedUserDetails) {
        const socketId = getReceiverSocketId(invitedUser._id);
        
        if (socketId) {
          io.to(socketId).emit("sessionInvitation", {
            type: 'session_invitation',
            teacher: {
              _id: teacher._id,
              name: teacher.name,
              profilePic: teacher.profilePic
            },
            skill,
            sessions: savedSessions.map(session => ({
              _id: session._id,
              date: session.timeSlot.date,
              startTime: session.timeSlot.startTime,
              endTime: session.timeSlot.endTime,
              price: session.price,
              status: session.status
            })),
            message: `${teacher.name} invited you to join their ${skill} learning sessions`,
            timestamp: new Date()
          });
        }
      }
    }
    
    res.status(201).json({
      message: "Time slots created successfully",
      sessions: savedSessions,
      invitedUsersCount: invitedUsers.length
    });
  } catch (error) {
    console.log("Error in createTimeSlots controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Book a session
export const bookSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user._id;

    const session = await Session.findById(sessionId)
      .populate('teacher', 'name email profilePic');

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== 'available') {
      return res.status(400).json({ message: "Session is not available for booking" });
    }

    if (session.teacher._id.toString() === studentId.toString()) {
      return res.status(400).json({ message: "You cannot book your own session" });
    }

    // Update session with student details
    session.student = studentId;
    session.status = 'booked';
    session.timeSlot.isBooked = true;
    session.timeSlot.bookedBy = studentId;
    session.videoCallRoom = `room_${session._id}_${Date.now()}`;

    await session.save();
    await session.populate('student', 'name email profilePic');

    res.status(200).json({
      message: "Session booked successfully",
      session
    });
  } catch (error) {
    console.log("Error in bookSession controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get available sessions for a skill from connected users only
export const getAvailableSessions = async (req, res) => {
  try {
    const { skill } = req.query;
    const userId = req.user._id;

    if (!skill) {
      return res.status(400).json({ message: "Skill parameter is required" });
    }

    // Get connected users
    const connectedUsers = await ConnectionRequest.findConnectedUsers(userId);
    const connectedUserIds = connectedUsers.map(user => user._id);

    // Find available sessions from connected users only
    const sessions = await Session.find({
      skill,
      status: 'available',
      teacher: { $in: connectedUserIds }, // Only from connected users
      'timeSlot.date': { $gte: new Date() }
    })
    .populate('teacher', 'name email profilePic skills description sessionsCompleted')
    .sort({ 'timeSlot.date': 1, 'timeSlot.startTime': 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.log("Error in getAvailableSessions controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's sessions (both as teacher and student)
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({
      $or: [
        { teacher: userId },
        { student: userId }
      ]
    })
    .populate('teacher', 'name email profilePic')
    .populate('student', 'name email profilePic')
    .sort({ 'timeSlot.date': -1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.log("Error in getUserSessions controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join video call
export const joinVideoCall = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(sessionId)
      .populate('teacher', 'name email profilePic')
      .populate('student', 'name email profilePic');

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session (teacher, booked student, or invited user)
    const isTeacher = session.teacher._id.toString() === userId.toString();
    const isBookedStudent = session.student && session.student._id.toString() === userId.toString();
    
    // Check if user is connected to the teacher (for invited users)
    let isInvitedUser = false;
    if (!isTeacher && !isBookedStudent) {
      const isConnected = await ConnectionRequest.exists({
        $or: [
          { fromUser: userId, toUser: session.teacher._id, status: "accepted" },
          { fromUser: session.teacher._id, toUser: userId, status: "accepted" }
        ]
      });
      isInvitedUser = !!isConnected;
    }

    if (!isTeacher && !isBookedStudent && !isInvitedUser) {
      return res.status(403).json({ message: "You are not authorized to join this session" });
    }

    // Check if session is within the scheduled time window
    const now = new Date();
    const sessionDate = new Date(session.timeSlot.date);
    const [startHours, startMinutes] = session.timeSlot.startTime.split(':');
    const [endHours, endMinutes] = session.timeSlot.endTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    // Allow joining during the entire session window
    if (now < sessionStart || now > sessionEnd) {
      return res.status(400).json({ 
        message: "Session can only be joined during the scheduled time period" 
      });
    }

    // If this is an invited user joining without booking, book the session
    if (isInvitedUser && !session.student) {
      session.student = userId;
      session.status = 'booked';
      session.timeSlot.isBooked = true;
      session.timeSlot.bookedBy = userId;
      if (!session.videoCallRoom) {
        session.videoCallRoom = `room_${session._id}_${Date.now()}`;
      }
      await session.populate('student', 'name email profilePic');
    }

    // Update join status
    if (isTeacher) {
      session.joinedAt.teacher = now;
    } else {
      session.joinedAt.student = now;
    }

    // Mark as ongoing since someone is joining
    session.status = 'ongoing';

    await session.save();

    // Notify other invited users that session is now live
    if (isTeacher) {
      const connectedUsers = await ConnectionRequest.findConnectedUsers(session.teacher._id);
      connectedUsers.forEach(user => {
        if (user._id.toString() !== userId.toString()) {
          const socketId = getReceiverSocketId(user._id);
          if (socketId) {
            io.to(socketId).emit("sessionGoingLive", {
              sessionId: session._id,
              skill: session.skill,
              teacher: session.teacher,
              message: `${session.skill} session is now live! Join now.`,
              timestamp: new Date()
            });
          }
        }
      });
    }

    res.status(200).json({
      message: "Joined session successfully",
      session,
      videoCallRoom: session.videoCallRoom,
      userRole: isTeacher ? 'teacher' : 'student'
    });
  } catch (error) {
    console.log("Error in joinVideoCall controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// End session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { feedback } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is part of this session
    const isTeacher = session.teacher.toString() === userId.toString();
    const isStudent = session.student && session.student.toString() === userId.toString();

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not authorized to end this session" });
    }

    session.status = 'completed';
    
    if (feedback) {
      session.feedback = {
        ...feedback,
        givenBy: userId
      };
    }

    await session.save();

    // Increment sessions completed count
    if (isTeacher) {
      await User.findByIdAndUpdate(session.teacher, { $inc: { sessionsCompleted: 1 } });
    }
    if (isStudent) {
      await User.findByIdAndUpdate(session.student, { $inc: { sessionsCompleted: 1 } });
    }

    res.status(200).json({
      message: "Session ended successfully",
      session
    });
  } catch (error) {
    console.log("Error in endSession controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get connected users who have available sessions
export const getConnectedTeachers = async (req, res) => {
  try {
    const { skill } = req.query;
    const userId = req.user._id;

    if (!skill) {
      return res.status(400).json({ message: "Skill parameter is required" });
    }

    // Get connected users
    const connectedUsers = await ConnectionRequest.findConnectedUsers(userId);
    const connectedUserIds = connectedUsers.map(user => user._id);

    // Get connected users who have the skill and available sessions
    const teachers = await User.aggregate([
      {
        $match: {
          _id: { $in: connectedUserIds },
          'skills.skillName': skill,
          'skills.proficiencyLevel': { $in: ['intermediate', 'advanced'] }
        }
      },
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'teacher',
          as: 'availableSessions',
          pipeline: [
            {
              $match: {
                skill: skill,
                status: 'available',
                'timeSlot.date': { $gte: new Date() }
              }
            }
          ]
        }
      },
      {
        $match: {
          'availableSessions.0': { $exists: true }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          profilePic: 1,
          skills: 1,
          description: 1,
          sessionsCompleted: 1,
          availableSessions: 1
        }
      },
      {
        $sort: { sessionsCompleted: -1 }
      }
    ]);

    res.status(200).json(teachers);
  } catch (error) {
    console.log("Error in getConnectedTeachers controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
