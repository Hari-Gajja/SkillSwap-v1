import Session from '../models/session.model.js';
import User from '../models/user.model.js';

export const createSession = async (req, res) => {
  try {
    const { teacherId, skill, scheduledTime, duration } = req.body;
    const studentId = req.user._id;

    if (!teacherId || !skill || !scheduledTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify that the teacher has the requested skill
    const hasSkill = teacher.skills.some(s => s.skillName === skill);
    if (!hasSkill) {
      return res.status(400).json({ message: "Teacher does not have the requested skill" });
    }

    const session = new Session({
      teacher: teacherId,
      student: studentId,
      skill,
      scheduledTime: new Date(scheduledTime),
      duration: duration || 60 // Default to 60 minutes if not specified
    });

    await session.save();

    // Increment sessions count for both users
    await User.findByIdAndUpdate(teacherId, { $inc: { sessionsCompleted: 1 } });
    await User.findByIdAndUpdate(studentId, { $inc: { sessionsCompleted: 1 } });

    res.status(201).json(session);
  } catch (error) {
    console.log("Error in createSession controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSessionsByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({
      $or: [{ teacher: userId }, { student: userId }]
    })
    .populate('teacher', 'name email profilePic')
    .populate('student', 'name email profilePic')
    .sort({ scheduledTime: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.log("Error in getSessionsByUser controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, feedback } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify that the user is part of the session
    if (session.teacher.toString() !== userId && session.student.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this session" });
    }

    session.status = status;
    if (feedback) {
      session.feedback = feedback;
    }

    await session.save();

    res.status(200).json(session);
  } catch (error) {
    console.log("Error in updateSessionStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const findPeers = async (req, res) => {
  try {
    const { skillToLearn } = req.query;
    const userId = req.user._id;

    const peers = await User.find({
      _id: { $ne: userId },
      'skills.skillName': skillToLearn,
      'skills.proficiencyLevel': { $in: ['intermediate', 'advanced'] }
    })
    .select('name email profilePic skills sessionsCompleted description')
    .sort({ sessionsCompleted: -1 });

    res.status(200).json(peers);
  } catch (error) {
    console.log("Error in findPeers controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
