import { useState, use  const fetchPeers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/auth/users');
      setPeers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };om "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Calendar, ChevronRight, Star, Users } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PeersPage = () => {
  const { authUser } = useAuthStore();
  const [peers, setPeers] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [sessionDate, setSessionDate] = useState(new Date());

  useEffect(() => {
    if (selectedSkill) {
      fetchPeers();
    }
  }, [selectedSkill]);

  const fetchPeers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/sessions/peers?skillToLearn=${selectedSkill}`);
      setPeers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching peers");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSession = async (peer) => {
    try {
      const response = await axiosInstance.post("/api/sessions/create", {
        teacherId: peer._id,
        skill: selectedSkill,
        scheduledTime: sessionDate,
      });

      toast.success("Session scheduled successfully!");
      setSelectedPeer(null);
      setSessionDate(new Date());
    } catch (error) {
      toast.error(error.response?.data?.message || "Error scheduling session");
    }
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6" />
              Find Learning Peers
            </h1>
            <p className="text-base-content/70">
              Connect with peers who can help you learn new skills
            </p>
          </div>

          {/* Skill Selection */}
          <div className="form-control w-full max-w-md">
            <label className="label">
              <span className="label-text font-medium">What do you want to learn?</span>
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

          {/* Peers List */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peers.map((peer) => (
                <div key={peer._id} className="card bg-base-200">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full">
                          <img src={peer.profilePic || "/avatar.png"} alt={peer.name} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{peer.name}</h3>
                        <p className="text-sm text-base-content/70">{peer.description || "No description"}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Star className="size-4" />
                          <span>{peer.sessionsCompleted} sessions completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {peer.skills.map((skill) => (
                          <span
                            key={skill.skillName}
                            className="badge badge-primary"
                          >
                            {skill.skillName} ({skill.proficiencyLevel})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedPeer(peer)}
                      >
                        Schedule Session
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {peers.length === 0 && selectedSkill && (
                <div className="col-span-full text-center py-10 text-base-content/70">
                  No peers found for this skill
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Session Modal */}
      {selectedPeer && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Schedule Session with {selectedPeer.name}</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Date and Time</span>
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="size-5" />
                <DatePicker
                  selected={sessionDate}
                  onChange={(date) => setSessionDate(date)}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedPeer(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleScheduleSession(selectedPeer)}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeersPage;
