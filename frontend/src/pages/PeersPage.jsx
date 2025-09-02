import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { MessageSquare, Users } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthStore } from "../store/useAuthStore";

const PeersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
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

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user._id} className="card bg-base-200 hover:bg-base-300 transition-colors">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                          <img 
                            src={user.profilePic || "/avatar.png"} 
                            alt={user.name}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-sm text-base-content/70">{user.email}</p>
                        <p className="text-sm text-base-content/70">Mobile: {user.mobileNumber}</p>
                        {user.skills && user.skills.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Skills:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.skills.map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="badge badge-sm badge-primary"
                                  title={`Proficiency: ${skill.proficiencyLevel}`}
                                >
                                  {skill.skillName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Link 
                            to="/"
                            className="btn btn-primary btn-sm gap-2 hover:gap-3 transition-all flex-1"
                            onClick={async (e) => {
                              e.preventDefault(); // Prevent navigation
                              try {
                                const response = await axiosInstance.post("/connection/send", {
                                  toUserId: user._id
                                });
                                console.log("Connection request response:", response.data);
                                toast.success(`Connection request sent to ${user.name}`);
                              } catch (error) {
                                console.error("Connection request error:", error);
                                toast.error(error.response?.data?.message || "Error sending connection request");
                              }
                            }}
                          >
                            <MessageSquare className="size-4" />
                            Connect
                          </Link>
                          <Link 
                            to={`/profile/${user._id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {users.length === 0 && !loading && (
                <div className="col-span-full text-center py-10">
                  <div className="flex flex-col items-center gap-2 text-base-content/70">
                    <Users className="size-16 mb-2" />
                    <p className="text-lg font-medium">No users found</p>
                    <p>Be the first one to invite your friends!</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PeersPage;
