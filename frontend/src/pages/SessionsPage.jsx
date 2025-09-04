import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Users, 
  Video, 
  Plus, 
  BookOpen, 
  DollarSign,
  Clock,
  XCircle
} from "lucide-react";

const SessionsPage = () => {
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [availableSessions, setAvailableSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateSlots, setShowCreateSlots] = useState(false);
  const [newSlots, setNewSlots] = useState([]);
  const [slotPrice, setSlotPrice] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openedSessions, setOpenedSessions] = useState(new Set());
  const [selectedConnectedUsers, setSelectedConnectedUsers] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Create time slot form
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: ""
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const shouldAutoStartSession = useCallback((session) => {
    if (session.status !== 'booked') return false;

    const now = new Date();
    const sessionDate = new Date(session.timeSlot.date);
    const [startHours, startMinutes] = session.timeSlot.startTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    // Auto-start when session time begins (within 1 minute of start time)
    const timeDiff = sessionStart - now;
    return timeDiff <= 60000 && timeDiff >= -60000; // 1 minute window
  }, []);

  const joinVideoCall = useCallback(async (sessionId) => {
    try {
      const response = await axiosInstance.post(`/sessions/${sessionId}/join`);
      const { videoCallRoom, userRole } = response.data;
      
      // Open video call in new window/tab
      const videoCallUrl = `/video-call/${videoCallRoom}?role=${userRole}&sessionId=${sessionId}`;
      window.open(videoCallUrl, '_blank', 'width=1200,height=800');
      
      toast.success("Joining video call...");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error joining video call");
    }
  }, []);

  const autoStartSession = useCallback(async (session) => {
    try {
      toast.success(`Session "${session.skill}" is starting now!`, {
        duration: 5000,
        icon: '🎥'
      });
      
      // Wait a moment for the toast to show
      setTimeout(() => {
        joinVideoCall(session._id);
      }, 1000);
      
    } catch (error) {
      console.error('Error auto-starting session:', error);
    }
  }, [joinVideoCall]);

  const checkAndAutoStartSessions = useCallback(() => {
    mySessions.forEach(session => {
      if (shouldAutoStartSession(session) && !openedSessions.has(session._id)) {
        autoStartSession(session);
        setOpenedSessions(prev => new Set([...prev, session._id]));
      }
    });
  }, [mySessions, openedSessions, shouldAutoStartSession, autoStartSession]);

  // Check for sessions that should auto-start
  useEffect(() => {
    if (mySessions.length > 0) {
      checkAndAutoStartSessions();
    }
  }, [currentTime, mySessions, checkAndAutoStartSessions]);

  const fetchAvailableSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/sessions/available?skill=${selectedSkill}`);
      setAvailableSessions(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching sessions");
    } finally {
      setLoading(false);
    }
  }, [selectedSkill]);

  const fetchConnectedTeachers = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/sessions/teachers?skill=${selectedSkill}`);
      console.log("Connected teachers:", response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  }, [selectedSkill]);

  const fetchMySessions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/sessions/my-sessions");
      setMySessions(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching your sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedUsers = async () => {
    try {
      const response = await axiosInstance.get('/messages/users');
      setConnectedUsers(response.data);
    } catch (error) {
      console.error('Error fetching connected users:', error);
    }
  };

  useEffect(() => {
    if (activeTab === "my-sessions") {
      fetchMySessions();
    } else if (activeTab === "teach") {
      fetchConnectedUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSkill && activeTab === "browse") {
      fetchAvailableSessions();
      fetchConnectedTeachers();
    }
  }, [selectedSkill, activeTab, fetchAvailableSessions, fetchConnectedTeachers]);

  const bookSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/sessions/${sessionId}/book`);
      toast.success("Session booked successfully!");
      fetchAvailableSessions();
      fetchMySessions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error booking session");
    }
  };

  const addTimeSlot = () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast.error("Please fill all slot details");
      return;
    }

    setNewSlots([...newSlots, { ...newSlot }]);
    setNewSlot({ date: "", startTime: "", endTime: "" });
  };

  const removeTimeSlot = (index) => {
    setNewSlots(newSlots.filter((_, i) => i !== index));
  };

  const createTimeSlots = async () => {
    if (!selectedSkill || newSlots.length === 0) {
      toast.error("Please select a skill and add time slots");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/sessions/create-slots", {
        skill: selectedSkill,
        timeSlots: newSlots,
        price: slotPrice,
        invitedUsers: selectedConnectedUsers
      });
      
      toast.success("Time slots created successfully!");
      if (selectedConnectedUsers.length > 0) {
        toast.success(`${selectedConnectedUsers.length} user${selectedConnectedUsers.length !== 1 ? 's' : ''} will be notified`);
      }
      
      setShowCreateSlots(false);
      setNewSlots([]);
      setSlotPrice(0);
      setSelectedSkill("");
      setSelectedConnectedUsers([]);
      fetchMySessions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating time slots");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    const sessionDate = new Date(date);
    return `${sessionDate.toLocaleDateString()} at ${time}`;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.timeSlot.date);
    const [startHours, startMinutes] = session.timeSlot.startTime.split(':');
    const [endHours, endMinutes] = session.timeSlot.endTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    if (session.status === 'completed') return 'completed';
    if (session.status === 'cancelled') return 'cancelled';
    if (session.status === 'ongoing') return 'ongoing';
    if (now > sessionEnd) return 'missed';
    if (now >= sessionStart && now <= sessionEnd) return 'ready';
    return 'scheduled';
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="size-6" />
              Learning Sessions
            </h1>
            <p className="text-base-content/70">
              Book sessions with experts or teach others your skills
            </p>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed w-fit">
            <button 
              className={`tab ${activeTab === "browse" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("browse")}
            >
              <BookOpen className="size-4 mr-2" />
              Browse Sessions
            </button>
            <button 
              className={`tab ${activeTab === "my-sessions" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("my-sessions")}
            >
              <Calendar className="size-4 mr-2" />
              My Sessions
            </button>
            <button 
              className={`tab ${activeTab === "teach" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("teach")}
            >
              <Users className="size-4 mr-2" />
              Teach Skills
            </button>
          </div>

          {/* Browse Sessions Tab */}
          {activeTab === "browse" && (
            <div className="space-y-6">
              {/* Live Sessions Alert */}
              {availableSessions.some(session => getSessionStatus(session) === 'ongoing' || getSessionStatus(session) === 'ready') && (
                <div className="alert alert-success">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span className="font-medium">
                      🔴 Live sessions available! Join now to participate.
                    </span>
                  </div>
                </div>
              )}

              {/* Skill Selection */}
              <div className="form-control w-full max-w-md">
                <label className="label">
                  <span className="label-text font-medium">Select skill to learn</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                >
                  <option value="">Select a skill</option>
                  {authUser?.skillsToLearn?.map((skill) => (
                    <option key={skill.skillName} value={skill.skillName}>
                      {skill.skillName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Sessions */}
              {selectedSkill && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Available Sessions for {selectedSkill}</h3>
                    <div className="text-sm text-base-content/70">
                      From your connections only
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  ) : availableSessions.length > 0 ? (
                    <div className="grid gap-4">
                      {availableSessions.map((session) => (
                        <div key={session._id} className="card bg-base-200 shadow">
                          <div className="card-body">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="avatar">
                                    <div className="w-10 h-10 rounded-full">
                                      {session.teacher.profilePic ? (
                                        <img src={session.teacher.profilePic} alt={session.teacher.name} />
                                      ) : (
                                        <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                                          {session.teacher.name[0]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2">
                                      {session.teacher.name}
                                      <span className="badge badge-success badge-xs">Connected</span>
                                    </h4>
                                    <p className="text-sm text-base-content/70">
                                      {session.teacher.sessionsCompleted || 0} sessions completed
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    {formatDateTime(session.timeSlot.date, session.timeSlot.startTime)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="size-4" />
                                    {session.duration} minutes
                                  </div>
                                  {session.price > 0 && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="size-4" />
                                      ${session.price}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => bookSession(session._id)}
                              >
                                Book Session
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-base-content/70">
                      <p>No available sessions found for this skill from your connections.</p>
                      <p className="text-sm mt-2">
                        Try connecting with more users who have this skill, or ask your connections to create teaching sessions.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* My Sessions Tab */}
          {activeTab === "my-sessions" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Your Sessions</h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : mySessions.length > 0 ? (
                <div className="grid gap-4">
                  {mySessions.map((session) => {
                    const status = getSessionStatus(session);
                    const isTeacher = session.teacher._id === authUser._id;
                    const otherUser = isTeacher ? session.student : session.teacher;
                    
                    return (
                      <div key={session._id} className="card bg-base-200 shadow">
                        <div className="card-body">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="avatar">
                                  <div className="w-10 h-10 rounded-full">
                                    {otherUser?.profilePic ? (
                                      <img src={otherUser.profilePic} alt={otherUser.name} />
                                    ) : (
                                      <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                                        {otherUser?.name?.[0] || '?'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {isTeacher ? `Teaching ${otherUser?.name || 'Student'}` : `Learning from ${otherUser?.name || 'Teacher'}`}
                                  </h4>
                                  <p className="text-sm text-base-content/70">
                                    Skill: {session.skill}
                                  </p>
                                </div>
                                <div className={`badge ${
                                  status === 'completed' ? 'badge-success' :
                                  status === 'ongoing' ? 'badge-info' :
                                  status === 'ready' ? 'badge-warning' :
                                  status === 'missed' ? 'badge-error' :
                                  status === 'cancelled' ? 'badge-error' :
                                  'badge-neutral'
                                }`}>
                                  {status}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="size-4" />
                                  {formatDateTime(session.timeSlot.date, session.timeSlot.startTime)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="size-4" />
                                  {session.duration} minutes
                                </div>
                                {session.price > 0 && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="size-4" />
                                    ${session.price}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {status === 'ready' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => joinVideoCall(session._id)}
                                >
                                  <Video className="size-4" />
                                  Join Call
                                </button>
                              )}
                              {status === 'ongoing' && (
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => joinVideoCall(session._id)}
                                >
                                  <Video className="size-4" />
                                  Rejoin Call
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/70">
                  You have no sessions yet
                </div>
              )}
            </div>
          )}

          {/* Teach Skills Tab */}
          {activeTab === "teach" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Teach Your Skills</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateSlots(true)}
                >
                  <Plus className="size-4" />
                  Create Time Slots
                </button>
              </div>

              {/* Create Slots Modal */}
              {showCreateSlots && (
                <div className="modal modal-open">
                  <div className="modal-box max-w-2xl">
                    <h3 className="font-bold text-lg mb-4">Create Teaching Time Slots</h3>
                    
                    {/* Skill Selection */}
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text">Select skill to teach</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value)}
                      >
                        <option value="">Select a skill</option>
                        {authUser?.skills?.map((skill) => (
                          <option key={skill.skillName} value={skill.skillName}>
                            {skill.skillName} ({skill.proficiencyLevel})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text">Price per session ($)</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        value={slotPrice}
                        onChange={(e) => setSlotPrice(Number(e.target.value))}
                        min="0"
                        step="1"
                      />
                    </div>

                    {/* Invite Connected Users */}
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text">Invite Connected Users (Optional)</span>
                      </label>
                      <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                        {connectedUsers.length > 0 ? (
                          <div className="space-y-2">
                            {connectedUsers.map((user) => (
                              <label key={user._id} className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-primary"
                                  checked={selectedConnectedUsers.includes(user._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedConnectedUsers([...selectedConnectedUsers, user._id]);
                                    } else {
                                      setSelectedConnectedUsers(selectedConnectedUsers.filter(id => id !== user._id));
                                    }
                                  }}
                                />
                                <img
                                  src={user.profilePic || "/avatar.png"}
                                  alt={user.name}
                                  className="size-8 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{user.name}</div>
                                  <div className="text-xs text-base-content/70">{user.email}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-base-content/70 py-4">
                            <p>No connected users found.</p>
                            <p className="text-xs mt-1">Connect with other users to invite them to your sessions.</p>
                          </div>
                        )}
                      </div>
                      {selectedConnectedUsers.length > 0 && (
                        <div className="text-sm text-base-content/70 mt-2">
                          {selectedConnectedUsers.length} user{selectedConnectedUsers.length !== 1 ? 's' : ''} will be notified
                        </div>
                      )}
                    </div>

                    {/* Add Time Slot */}
                    <div className="border rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3">Add Time Slot</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Date</span>
                          </label>
                          <input
                            type="date"
                            className="input input-bordered"
                            value={newSlot.date}
                            onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">Start Time</span>
                          </label>
                          <input
                            type="time"
                            className="input input-bordered"
                            value={newSlot.startTime}
                            onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">End Time</span>
                          </label>
                          <input
                            type="time"
                            className="input input-bordered"
                            value={newSlot.endTime}
                            onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline mt-3"
                        onClick={addTimeSlot}
                      >
                        <Plus className="size-4" />
                        Add Slot
                      </button>
                    </div>

                    {/* Time Slots List */}
                    {newSlots.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-3">Added Time Slots</h4>
                        <div className="space-y-2">
                          {newSlots.map((slot, index) => (
                            <div key={index} className="flex justify-between items-center bg-base-300 p-3 rounded">
                              <span>
                                {new Date(slot.date).toLocaleDateString()} from {slot.startTime} to {slot.endTime}
                              </span>
                              <button
                                className="btn btn-sm btn-error btn-outline"
                                onClick={() => removeTimeSlot(index)}
                              >
                                <XCircle className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="modal-action">
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          setShowCreateSlots(false);
                          setSelectedConnectedUsers([]);
                          setNewSlots([]);
                          setSelectedSkill("");
                          setSlotPrice(0);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={createTimeSlots}
                        disabled={loading || !selectedSkill || newSlots.length === 0}
                      >
                        {loading ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Creating...
                          </>
                        ) : (
                          "Create Slots"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher's Sessions */}
              <div className="space-y-4">
                <h4 className="font-medium">Your Teaching Sessions</h4>
                {mySessions.filter(session => session.teacher._id === authUser._id).length > 0 ? (
                  <div className="grid gap-4">
                    {mySessions
                      .filter(session => session.teacher._id === authUser._id)
                      .map((session) => {
                        const status = getSessionStatus(session);
                        
                        return (
                          <div key={session._id} className="card bg-base-200 shadow">
                            <div className="card-body">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="avatar">
                                      <div className="w-10 h-10 rounded-full">
                                        {session.student?.profilePic ? (
                                          <img src={session.student.profilePic} alt={session.student.name} />
                                        ) : (
                                          <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                                            {session.student?.name?.[0] || '?'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium">
                                        Teaching {session.student?.name || 'Student'}
                                      </h4>
                                      <p className="text-sm text-base-content/70">
                                        Skill: {session.skill}
                                      </p>
                                    </div>
                                    <div className={`badge ${
                                      status === 'completed' ? 'badge-success' :
                                      status === 'ongoing' ? 'badge-info' :
                                      status === 'ready' ? 'badge-warning' :
                                      status === 'missed' ? 'badge-error' :
                                      status === 'cancelled' ? 'badge-error' :
                                      'badge-neutral'
                                    }`}>
                                      {status}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="size-4" />
                                      {formatDateTime(session.timeSlot.date, session.timeSlot.startTime)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="size-4" />
                                      {session.duration} minutes
                                    </div>
                                    {session.price > 0 && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="size-4" />
                                        ${session.price}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {(status === 'ready' || status === 'ongoing') && (
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => joinVideoCall(session._id)}
                                    >
                                      <Video className="size-4" />
                                      {status === 'ready' ? 'Start Call' : 'Rejoin Call'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-base-content/70">
                    You haven&apos;t created any teaching sessions yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
